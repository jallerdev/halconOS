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


def _build_paginas_amarillas_mx_url(query: str, city: Optional[str]) -> str:
    q = urllib.parse.quote(query.strip())
    where = urllib.parse.quote(city.strip()) if city else "mexico"
    return f"https://www.seccionamarilla.com.mx/resultados/{q}/{where}"


def _build_paginas_amarillas_ar_url(query: str, city: Optional[str]) -> str:
    q = urllib.parse.quote(query.strip())
    where = urllib.parse.quote(city.strip()) if city else "argentina"
    return f"https://www.paginasamarillas.com.ar/b/{q}/{where}"


def _build_bing_search_url(query: str, city: Optional[str]) -> str:
    q = f"{query} en {city} contacto telefono direccion" if city else f"{query} contacto telefono direccion"
    return f"https://www.bing.com/search?q={urllib.parse.quote(q)}&setlang=es"


def _build_duckduckgo_search_url(query: str, city: Optional[str]) -> str:
    q = f"{query} en {city} contacto telefono direccion" if city else f"{query} contacto telefono direccion"
    # DuckDuckGo HTML version — más amable con scrapers que la JSON.
    return f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(q)}&kl=es-es"


def _build_workana_url(query: str, city: Optional[str]) -> str:
    """
    Workana — plataforma #1 de freelancers en LatAm. La URL de búsqueda de
    proyectos lista freelancers + empresas que contratan freelance. `city`
    no aplica directo (Workana es remote-first); ignoramos.
    """
    q = urllib.parse.quote(query.strip())
    return f"https://www.workana.com/jobs?language=es&query={q}"


def _build_fiverr_url(query: str, city: Optional[str]) -> str:
    """
    Fiverr — marketplace global #1 de freelancers. Búsqueda por "gig" (servicio).
    Cada resultado trae seller + servicio + rating + país. JS-heavy → Playwright.
    `city` no aplica (Fiverr es 100% remote).
    """
    q = urllib.parse.quote(query.strip())
    return f"https://www.fiverr.com/search/gigs?query={q}&source=top-bar&search_in=everywhere"


def _build_behance_url(query: str, city: Optional[str]) -> str:
    """
    Behance — portfolios de diseñadores / creativos (propiedad de Adobe).
    Búsqueda por usuarios — devuelve creadores con sus portafolios. JS-heavy.
    """
    q = urllib.parse.quote(query.strip())
    return f"https://www.behance.net/search/users?search={q}"


def _build_dribbble_url(query: str, city: Optional[str]) -> str:
    """
    Dribbble — comunidad de diseñadores. Búsqueda por diseñadores con
    portafolios públicos. JS-heavy, requiere Playwright.
    """
    q = urllib.parse.quote(query.strip())
    return f"https://dribbble.com/search/{q}?type=designer"


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


# Sitios que requieren JS rendering — usan Playwright en vez de httpx.
_JS_REQUIRED_SOURCES = {
    "fiverr",
    "behance",
    "dribbble",
}

# Routing source → builder. Una fuente nueva = una línea aquí.
_URL_BUILDERS = {
    "paginas-amarillas-co": _build_paginas_amarillas_co_url,
    "paginas-amarillas-mx": _build_paginas_amarillas_mx_url,
    "paginas-amarillas-ar": _build_paginas_amarillas_ar_url,
    "bing-search": _build_bing_search_url,
    "duckduckgo-search": _build_duckduckgo_search_url,
    "workana": _build_workana_url,
    "fiverr": _build_fiverr_url,
    "behance": _build_behance_url,
    "dribbble": _build_dribbble_url,
}


def _fetch_html_for_source(source: str, query: str, city: Optional[str], target_url: Optional[str]) -> str:
    """
    Decide qué URL fetchar y con qué método (estático vs Playwright) según
    la fuente. Sitios en `_JS_REQUIRED_SOURCES` van directo a Playwright; el
    resto intenta estático primero y cae a Playwright si el contenido es magro.
    """
    if source == "url":
        if not target_url:
            raise ValueError("source='url' requiere `target_url` en el request.")
        try:
            html = _fetch_static(target_url)
            if len(_clean_html(html)) > 500:
                return html
            logger.info("URL devolvió HTML magro, reintento con Playwright")
        except Exception as e:
            logger.info("Fetch estático falló (%s), reintento con Playwright", e)
        return _fetch_with_playwright(target_url)

    builder = _URL_BUILDERS.get(source)
    if not builder:
        raise ValueError(f"Source no soportado: {source}")

    url = builder(query, city)

    if source in _JS_REQUIRED_SOURCES:
        return _fetch_with_playwright(url)

    # Static-first con fallback a Playwright. Cubre sitios que a veces sirven JS
    # detrás de un loader (Indeed lo hace en algunas regiones).
    try:
        html = _fetch_static(url)
        if len(_clean_html(html)) > 500:
            return html
        logger.info("Source %s devolvió HTML magro, fallback Playwright", source)
    except Exception as e:
        logger.info("Source %s fetch estático falló (%s), fallback Playwright", source, e)
    return _fetch_with_playwright(url)


# ─────────────────────── OpenStreetMap (Overpass API) ────────────────────────
#
# OSM no necesita LLM: el API Overpass devuelve JSON estructurado directamente.
# Mucho más rápido (~1-2s) y 100% gratis (rate limit: 1 req/seg al server público).
# Cubre cualquier ciudad del mundo. Datos: nombre, lat/lng, tipo, a veces tel/web.

_OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Mapeo intuitivo de queries en español a tags OSM. Si el usuario escribe algo
# fuera de este set, hacemos búsqueda fuzzy con `~name~` (regex en el name tag).
_OSM_TAG_HINTS = {
    "cafetería": ("amenity", "cafe"),
    "cafeteria": ("amenity", "cafe"),
    "café": ("amenity", "cafe"),
    "restaurante": ("amenity", "restaurant"),
    "bar": ("amenity", "bar"),
    "pub": ("amenity", "pub"),
    "hotel": ("tourism", "hotel"),
    "hostal": ("tourism", "hostel"),
    "panadería": ("shop", "bakery"),
    "panaderia": ("shop", "bakery"),
    "farmacia": ("amenity", "pharmacy"),
    "veterinaria": ("amenity", "veterinary"),
    "clínica": ("amenity", "clinic"),
    "clinica": ("amenity", "clinic"),
    "barbería": ("shop", "hairdresser"),
    "barberia": ("shop", "hairdresser"),
    "peluquería": ("shop", "hairdresser"),
    "supermercado": ("shop", "supermarket"),
    "gimnasio": ("leisure", "fitness_centre"),
    "taller": ("shop", "car_repair"),
    "abogado": ("office", "lawyer"),
    "contador": ("office", "accountant"),
}


def _geocode_city(city: str) -> Optional[tuple[float, float, float, float]]:
    """Usa Nominatim para convertir 'Medellín' en bbox (south,west,north,east)."""
    r = httpx.get(
        "https://nominatim.openstreetmap.org/search",
        params={"q": city, "format": "json", "limit": 1},
        headers={"User-Agent": "HalconOS-Scraper/1.0 (https://halcon.jvagencia.com)"},
        timeout=10.0,
    )
    r.raise_for_status()
    data = r.json()
    if not data:
        return None
    bb = data[0].get("boundingbox")
    if not bb or len(bb) != 4:
        return None
    return float(bb[0]), float(bb[2]), float(bb[1]), float(bb[3])


def _scrape_openstreetmap(query: str, city: Optional[str], max_results: int) -> list[PlaceResult]:
    """Llama a Overpass API directamente — no necesita Playwright ni LLM."""
    bbox = _geocode_city(city) if city else None
    bbox_clause = f"({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]})" if bbox else ""

    q_lower = query.lower().strip()
    if q_lower in _OSM_TAG_HINTS:
        key, value = _OSM_TAG_HINTS[q_lower]
        filter_clause = f'["{key}"="{value}"]'
    else:
        # Fuzzy match en el nombre — `~"texto"` es regex insensitive.
        safe_q = query.replace('"', '').replace("\\", "")
        filter_clause = f'["name"~"{safe_q}",i]'

    overpass_query = f"""
    [out:json][timeout:15];
    (
      node{filter_clause}{bbox_clause};
      way{filter_clause}{bbox_clause};
    );
    out center {max_results};
    """

    r = httpx.post(
        _OVERPASS_URL,
        data={"data": overpass_query},
        headers={"User-Agent": "HalconOS-Scraper/1.0"},
        timeout=30.0,
    )
    r.raise_for_status()
    elements = r.json().get("elements", [])

    out: list[PlaceResult] = []
    for el in elements[:max_results]:
        tags = el.get("tags", {})
        name = tags.get("name")
        if not name:
            continue
        # `way` results traen `center`, `node` results traen `lat`/`lon` directos.
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        osm_id = f"{el.get('type', 'node')}/{el.get('id', '')}"
        h = hashlib.sha256(f"osm:{osm_id}".encode()).hexdigest()[:16]

        address_parts = [
            tags.get("addr:street"),
            tags.get("addr:housenumber"),
            tags.get("addr:city") or city,
        ]
        address = ", ".join(p for p in address_parts if p) or None

        out.append(
            PlaceResult(
                id=f"scrape:openstreetmap:{h}",
                displayName=name,
                formattedAddress=address,
                location=None if lat is None or lon is None else {"latitude": float(lat), "longitude": float(lon)},  # type: ignore
                rating=None,
                userRatingCount=None,
                websiteUri=tags.get("website") or tags.get("contact:website"),
                businessStatus="OPERATIONAL",
                types=[tags.get("amenity") or tags.get("shop") or tags.get("office") or "place"],
                priceLevel=None,
                googleMapsUri=f"https://www.openstreetmap.org/{osm_id}" if el.get("id") else None,
                nationalPhoneNumber=tags.get("phone") or tags.get("contact:phone"),
                internationalPhoneNumber=None,
            )
        )
    return out


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

_EXTRACTION_PROMPT = """Extrae todos los LEADS listados en el contenido de la página. Un lead puede ser
un negocio, una empresa que contrata, un freelancer con perfil público, o un creador
con portafolio (Behance/Dribbble/Fiverr).

Para CADA lead devuelve un objeto con estos campos (null si no es visible):
- name: nombre del negocio / empresa / freelancer / creador (REQUERIDO).
- phone: teléfono si está visible (suele faltar en sites de freelancers).
- address: dirección física O país/región si es freelancer remoto.
- website: URL del sitio web personal o del perfil público.
- rating: número 0-5 si se muestra (Fiverr usa 5 estrellas; OK pasarlo igual).
- review_count: cantidad de reviews/ratings como entero.
- category: tipo de servicio / sector / skill (ej. "diseño de logos", "marketing digital").

REGLAS:
1. SOLO devuelve leads del contenido principal. Ignora navegación, anuncios, sidebars,
   "también buscaron", "relacionados", footer.
2. Si la página es de búsqueda → devuelve los resultados.
3. Si es la página de UN solo perfil/negocio → devuelve un array de 1.
4. Excluye encabezados genéricos de categoría. Queremos perfiles/negocios reales con nombre.
5. Para Fiverr: el "name" es el seller (no el título del gig); el "category" es el servicio.
6. Para Behance/Dribbble: el "name" es el creador; el "website" es su URL de perfil.

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
    """
    Pipeline completo. OSM va por un camino separado (Overpass devuelve JSON,
    no necesita Playwright ni LLM); todo el resto: fetch → clean → LLM extract → normalize.
    """
    logger.info("scrape source=%s query=%r city=%r", source, query, city)

    # Path rápido: OSM no necesita LLM ni Playwright.
    if source == "openstreetmap":
        return _scrape_openstreetmap(query, city, max_results)

    html = _fetch_html_for_source(source, query, city, target_url)
    cleaned = _clean_html(html)
    if not cleaned:
        logger.warning("HTML limpio quedó vacío")
        return []

    raw_list = _extract_with_gemini(cleaned)
    # Filtra ruido: sin nombre = entrada inútil.
    filtered = [r for r in raw_list if isinstance(r, dict) and r.get("name")]
    return [_to_place_result(r, source) for r in filtered[:max_results]]
