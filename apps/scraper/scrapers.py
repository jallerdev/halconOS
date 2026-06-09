"""
Scrapers para HalcónOS — pipeline minimal sin librerías opinionadas:

    fetch (httpx | playwright)  →  clean (selectolax)  →  extract (Gemini structured output)
                                                                             ↓
                                                                       PlaceResult[]

Cada paso es ~30 líneas. Edge cases (HTML grande, JS, sitios que bloquean,
LLM que retorna JSON mal formado) se manejan explícitamente acá — no hay
caja negra de terceros que se rompa con cada release.

Fuentes soportadas (v1):
  - paginas-amarillas-co: directorio LatAm con HTML estático.
  - bing-search: búsqueda web genérica (httpx, sin JS).
  - url: scrape de URL arbitraria provista por el cliente.

Para agregar fuente nueva: añade un branch en `_fetch_html_for_source` y listo.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import re
import urllib.parse
from typing import Optional

import httpx
from google import genai
from google.genai import types as genai_types
from selectolax.parser import HTMLParser

from models import PlaceResult

logger = logging.getLogger(__name__)

# ─────────────────────────────── Config ────────────────────────────────

GEMINI_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

# Cliente Gemini — un solo objeto compartido. Se inicializa lazy en
# `_extract_with_gemini` por si la key no está al import-time.
_genai_client: Optional[genai.Client] = None


def _get_genai_client() -> genai.Client:
    global _genai_client
    if _genai_client is None:
        if not GEMINI_KEY:
            raise RuntimeError("Falta GEMINI_API_KEY en el entorno del scraper.")
        _genai_client = genai.Client(api_key=GEMINI_KEY)
    return _genai_client

# User-Agent realista de Chrome reduce el bloqueo en sitios sensibles.
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "es-CO,es;q=0.9,en;q=0.7",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

REQUEST_TIMEOUT = 25.0
MAX_HTML_CHARS_FOR_LLM = 60_000  # ~15k tokens — cabe en cualquier context window
PLAYWRIGHT_WAIT = 3.0  # seg que esperamos por render JS


# ─────────────────────── Builders de URL por fuente ────────────────────


def _build_paginas_amarillas_co_url(query: str, city: Optional[str]) -> str:
    q = urllib.parse.quote(query.strip())
    if city:
        c = urllib.parse.quote(city.strip())
        return f"https://www.paginasamarillas.com.co/buscar/{q}/{c}"
    return f"https://www.paginasamarillas.com.co/buscar/{q}"


def _build_bing_search_url(query: str, city: Optional[str]) -> str:
    q = f"{query} en {city} contacto telefono direccion" if city else f"{query} contacto telefono direccion"
    return f"https://www.bing.com/search?q={urllib.parse.quote(q)}&setlang=es"


# ─────────────────────── Fetch HTML ────────────────────────


def _fetch_static(url: str) -> str:
    """HTTP GET simple. Adecuado para directorios estáticos."""
    with httpx.Client(
        headers=DEFAULT_HEADERS,
        timeout=REQUEST_TIMEOUT,
        follow_redirects=True,
        http2=False,
    ) as client:
        r = client.get(url)
        r.raise_for_status()
        return r.text


def _fetch_with_playwright(url: str) -> str:
    """
    Playwright headless Chromium — solo para sitios que requieren JS rendering
    o anti-bot suave. Más lento (10-30s) y consume RAM. Reservado para casos
    donde _fetch_static devuelve HTML vacío de contenido.

    Importamos playwright lazy para que el startup del servicio no falle si
    Chromium no está instalado (ej. en dev local sin `playwright install`).
    """
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            context = browser.new_context(
                user_agent=DEFAULT_HEADERS["User-Agent"],
                locale="es-CO",
                viewport={"width": 1280, "height": 800},
            )
            page = context.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=int(REQUEST_TIMEOUT * 1000))
            page.wait_for_timeout(int(PLAYWRIGHT_WAIT * 1000))
            return page.content()
        finally:
            browser.close()


def _fetch_html_for_source(source: str, query: str, city: Optional[str], target_url: Optional[str]) -> str:
    """
    Decide qué URL fetchar y con qué método (estático vs Playwright) según
    la fuente. Una fuente nueva = un branch nuevo aquí.
    """
    if source == "paginas-amarillas-co":
        url = _build_paginas_amarillas_co_url(query, city)
        return _fetch_static(url)
    if source == "bing-search":
        url = _build_bing_search_url(query, city)
        return _fetch_static(url)
    if source == "url":
        if not target_url:
            raise ValueError("source='url' requiere `target_url` en el request.")
        # Intento estático primero, fallback a Playwright si el HTML está vacío.
        try:
            html = _fetch_static(target_url)
            text_size = len(_clean_html(html))
            if text_size > 500:
                return html
            logger.info("URL devolvió HTML magro (%d chars text), reintento con Playwright", text_size)
        except Exception as e:
            logger.info("Fetch estático falló (%s), reintento con Playwright", e)
        return _fetch_with_playwright(target_url)
    raise ValueError(f"Source no soportado: {source}")


# ─────────────────────── Limpieza HTML ────────────────────────


def _clean_html(html: str) -> str:
    """
    Tira scripts/styles/ads/nav/footer/etc para reducir ruido y tokens. El
    LLM recibe solo lo importante: el contenido principal del page.
    """
    tree = HTMLParser(html)
    for tag in ("script", "style", "noscript", "iframe", "svg", "form", "nav", "footer", "header", "aside"):
        for n in tree.css(tag):
            n.decompose()
    # Truncar a un tamaño que cabe en context. Es preferible perder filas que
    # explotar el LLM.
    text = tree.body.html if tree.body else tree.html
    if not text:
        return ""
    # Normaliza whitespace: múltiples espacios y newlines → uno.
    text = re.sub(r"\s+", " ", text)
    return text[:MAX_HTML_CHARS_FOR_LLM]


# ─────────────────────── Extracción con LLM ────────────────────────


_EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "businesses": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "phone": {"type": ["string", "null"]},
                    "address": {"type": ["string", "null"]},
                    "website": {"type": ["string", "null"]},
                    "rating": {"type": ["number", "null"]},
                    "review_count": {"type": ["integer", "null"]},
                    "category": {"type": ["string", "null"]},
                },
                "required": ["name"],
            },
        }
    },
    "required": ["businesses"],
}

_EXTRACTION_PROMPT = """Extrae todos los negocios listados en el contenido de la página.

Para CADA negocio devuelve un objeto con estos campos (null si no es visible):
- name: nombre del negocio (REQUERIDO).
- phone: teléfono incluyendo código de país si está visible.
- address: dirección completa.
- website: URL del sitio web.
- rating: número 0-5 si se muestra.
- review_count: cantidad de reseñas como entero.
- category: tipo de negocio / sector.

REGLAS:
1. SOLO devuelve negocios listados en el contenido principal. Ignora navegación, anuncios,
   sidebars, "también buscaron", "relacionados", footer.
2. Si la página es de búsqueda → devuelve los resultados.
3. Si es la página de UN solo negocio → devuelve un array de 1.
4. Excluye encabezados genéricos de categoría. Queremos negocios reales con nombre.

Devuelve JSON con esta estructura exacta: {"businesses": [{...}, {...}]}.

Contenido de la página:
---
"""


def _extract_with_gemini(cleaned_html: str) -> list[dict]:
    """
    Llama a Gemini con `response_mime_type=application/json` + `response_schema`.
    El modelo retorna JSON válido contra el schema o falla — sin parseo manual.
    """
    client = _get_genai_client()

    config = genai_types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=_EXTRACTION_SCHEMA,
        temperature=0,
    )

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=_EXTRACTION_PROMPT + cleaned_html,
        config=config,
    )

    try:
        data = json.loads(response.text or "{}")
    except (ValueError, AttributeError) as e:
        logger.warning("Gemini devolvió JSON inválido: %s", e)
        return []
    return data.get("businesses", []) if isinstance(data, dict) else []


# ─────────────────────── Normalización ────────────────────────


def _stable_id(source: str, raw: dict) -> str:
    """ID estable a partir de nombre+dirección+tel — idempotente entre scrapes."""
    seed = f"{raw.get('name', '')}|{raw.get('address', '')}|{raw.get('phone', '')}"
    h = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:16]
    return f"scrape:{source}:{h}"


def _to_place_result(raw: dict, source: str) -> PlaceResult:
    return PlaceResult(
        id=_stable_id(source, raw),
        displayName=raw.get("name"),
        formattedAddress=raw.get("address"),
        location=None,
        rating=_to_float(raw.get("rating")),
        userRatingCount=_to_int(raw.get("review_count")),
        websiteUri=raw.get("website"),
        businessStatus="OPERATIONAL",
        types=[raw["category"]] if raw.get("category") else [],
        priceLevel=None,
        googleMapsUri=None,
        nationalPhoneNumber=raw.get("phone"),
        internationalPhoneNumber=None,
    )


def _to_float(v):
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _to_int(v):
    if v is None:
        return None
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


# ─────────────────────── Entrypoint ────────────────────────


def scrape(source: str, query: str, city: Optional[str], target_url: Optional[str], max_results: int) -> list[PlaceResult]:
    """Pipeline completo: fetch → clean → extract → normalize."""
    logger.info("scrape source=%s query=%r city=%r", source, query, city)

    html = _fetch_html_for_source(source, query, city, target_url)
    cleaned = _clean_html(html)
    if not cleaned:
        logger.warning("HTML limpio quedó vacío")
        return []

    raw_list = _extract_with_gemini(cleaned)
    # Filtra ruido: sin nombre = entrada inútil.
    filtered = [r for r in raw_list if isinstance(r, dict) and r.get("name")]
    return [_to_place_result(r, source) for r in filtered[:max_results]]
