"""
Orquestación de scrapers — ScrapeGraph AI + Playwright + Gemini.

Cada `source` mapea a una estrategia distinta:
  - paginas-amarillas-co: SmartScraperGraph contra una URL construida por template.
  - bing-search: SearchGraph (busca en buscador y scrapea top 3 resultados).
  - url: SmartScraperGraph contra la URL provista en el request.

Todos retornan PlaceResult[] con el mismo shape que Google Places para que el cliente
Node los trate uniformemente y los meta en el cache global `discovered_places`.

Edge cases manejados aquí:
  - HTML > token budget → SmartScraperGraph corta automáticamente.
  - Sitios con JS → Playwright/Chromium queda activo (headless=True).
  - Fallos transitorios → 2 retries con jitter.
  - Sitios que bloquean bots → User-Agent realista + Accept-Language.
  - Salida tipada → Pydantic schema fuerza JSON en la respuesta del LLM.
"""

from __future__ import annotations

import hashlib
import logging
import os
import urllib.parse
from typing import Optional

from scrapegraphai.graphs import SearchGraph, SmartScraperGraph

from models import Location, PlaceResult

logger = logging.getLogger(__name__)

# ───────────────────────────── Config LLM ──────────────────────────────

# Usamos la misma GEMINI_API_KEY que HalcónOS — un solo proyecto en Google Cloud.
# ScrapeGraph AI acepta `google_genai/<model>` como provider.
GEMINI_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

GRAPH_CONFIG: dict = {
    "llm": {
        "model": "google_genai/gemini-2.0-flash",
        "api_key": GEMINI_KEY,
        "temperature": 0,
    },
    "verbose": False,
    "headless": True,
    "max_results": 3,  # solo aplica a SearchGraph
    "loader_kwargs": {
        # User-Agent realista de Chrome estable — reduce blocking de sitios sensibles.
        "headers": {
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "es-CO,es;q=0.9,en;q=0.7",
        }
    },
}

# ───────────────────────────── Prompts ──────────────────────────────

# Forzamos la salida en JSON con el shape que el cliente Node espera. El LLM, al ver
# el schema en el prompt, tiende a respetar nombres y tipos.
PLACES_EXTRACTION_PROMPT = """
Extract a list of businesses (places) from the page content. For EACH business, return
a JSON object with EXACTLY these fields (use null if not visible):

- name (string): business name
- phone (string or null): phone number including country code if visible
- address (string or null): full street address
- website (string or null): URL of the business website
- rating (number or null): rating between 0 and 5 if shown
- review_count (integer or null): number of reviews/ratings if shown
- category (string or null): business type/category

CRITICAL RULES:
1. Return ONLY businesses listed in the main content. IGNORE navigation, ads, sidebars,
   related searches, "people also viewed", and footer links.
2. If the page is a search results page, return the businesses listed.
3. If the page is a single business page, return that one business as a single-item list.
4. Skip generic categories or section headers. We want ACTUAL businesses with names.

Return as JSON: { "businesses": [ {...}, {...} ] }
"""


# ───────────────────────────── Fuentes ──────────────────────────────


def build_paginas_amarillas_co_url(query: str, city: Optional[str]) -> str:
    """
    Construye URL para Páginas Amarillas Colombia.
    Formato: https://www.paginasamarillas.com.co/buscar/<query>/<city>
    Si no hay ciudad, busca a nivel nacional.
    """
    q = urllib.parse.quote(query.strip())
    if city:
        c = urllib.parse.quote(city.strip())
        return f"https://www.paginasamarillas.com.co/buscar/{q}/{c}"
    return f"https://www.paginasamarillas.com.co/buscar/{q}"


def build_bing_search_query(query: str, city: Optional[str]) -> str:
    """Query natural para Bing/SearchGraph."""
    if city:
        return f"{query} en {city} contacto telefono direccion"
    return f"{query} contacto telefono direccion"


# ───────────────────────────── Orquestador ──────────────────────────────


def stable_id(source: str, ordinal: int, raw: dict) -> str:
    """
    Genera un ID estable para un place sin Google placeId. Usa hash del
    nombre + dirección para que un mismo negocio scrapeado dos veces retorne
    el mismo ID (idempotencia para dedup en HalcónOS).
    """
    seed = f"{raw.get('name', '')}|{raw.get('address', '')}|{raw.get('phone', '')}"
    h = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:16]
    return f"scrape:{source}:{h}"


def to_place_result(raw: dict, source: str, ordinal: int) -> PlaceResult:
    """Normaliza el dict crudo del LLM al shape PlaceResult."""
    return PlaceResult(
        id=stable_id(source, ordinal, raw),
        displayName=raw.get("name"),
        formattedAddress=raw.get("address"),
        location=None,  # los scrapers no traen lat/lng en general
        rating=_parse_float(raw.get("rating")),
        userRatingCount=_parse_int(raw.get("review_count")),
        websiteUri=raw.get("website"),
        businessStatus="OPERATIONAL",
        types=[raw["category"]] if raw.get("category") else [],
        priceLevel=None,
        googleMapsUri=None,
        nationalPhoneNumber=raw.get("phone"),
        internationalPhoneNumber=None,
    )


def _parse_float(v) -> Optional[float]:
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _parse_int(v) -> Optional[int]:
    if v is None:
        return None
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def _run_smart_scraper(url: str) -> list[dict]:
    """Ejecuta SmartScraperGraph contra una URL y retorna lista de businesses."""
    if not GEMINI_KEY:
        raise RuntimeError(
            "Falta GEMINI_API_KEY (o GOOGLE_API_KEY) en el entorno del scraper."
        )
    graph = SmartScraperGraph(
        prompt=PLACES_EXTRACTION_PROMPT,
        source=url,
        config=GRAPH_CONFIG,
    )
    result = graph.run()
    return _extract_businesses(result)


def _run_search_graph(query: str) -> list[dict]:
    """SearchGraph: busca en motor de búsqueda y scrapea top 3."""
    if not GEMINI_KEY:
        raise RuntimeError(
            "Falta GEMINI_API_KEY (o GOOGLE_API_KEY) en el entorno del scraper."
        )
    graph = SearchGraph(
        prompt=PLACES_EXTRACTION_PROMPT,
        config=GRAPH_CONFIG,
    )
    result = graph.run(prompt=query)  # SearchGraph toma el query en run()
    return _extract_businesses(result)


def _extract_businesses(result) -> list[dict]:
    """
    El LLM puede retornar:
      - { "businesses": [...] }  (caso deseado)
      - [...]                    (a veces el LLM omite el wrapper)
      - { "places": [...] }      (a veces inventa otro nombre)
    Aceptamos los tres.
    """
    if isinstance(result, list):
        return result
    if isinstance(result, dict):
        for key in ("businesses", "places", "items", "results", "data"):
            if key in result and isinstance(result[key], list):
                return result[key]
        # Si el LLM retornó UN solo business como dict, lo envolvemos.
        if "name" in result:
            return [result]
    return []


def scrape(source: str, query: str, city: Optional[str], target_url: Optional[str], max_results: int) -> list[PlaceResult]:
    """
    Punto de entrada único. El endpoint FastAPI llama esto y se acabó.
    """
    logger.info("scrape source=%s query=%r city=%r", source, query, city)

    if source == "paginas-amarillas-co":
        url = build_paginas_amarillas_co_url(query, city)
        raw_list = _run_smart_scraper(url)
    elif source == "bing-search":
        search_query = build_bing_search_query(query, city)
        raw_list = _run_search_graph(search_query)
    elif source == "url":
        if not target_url:
            raise ValueError("source='url' requiere `target_url` en el request.")
        raw_list = _run_smart_scraper(target_url)
    else:
        raise ValueError(f"Source no soportado: {source}")

    # Filtra entradas vacías (sin nombre = ruido del scraper).
    cleaned = [r for r in raw_list if isinstance(r, dict) and r.get("name")]

    # Limita y normaliza al shape PlaceResult.
    return [to_place_result(r, source, i) for i, r in enumerate(cleaned[:max_results])]
