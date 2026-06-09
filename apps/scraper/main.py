"""
FastAPI entrypoint para el microservicio de scraping de HalcónOS.

Endpoints:
  GET  /health   → healthcheck para Render (siempre 200 OK).
  POST /scrape   → ejecuta scraping y retorna PlaceResult[].

Auth: header `X-Scraper-Secret`. El cliente Node (HalcónOS) envía la misma key que
tiene en SCRAPER_SHARED_SECRET. Sin auth no se gasta GPU/CPU.

Logs: stdout, capturados por Render automáticamente.
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from models import ScrapeRequest, ScrapeResponse
from scrapers import scrape, QuotaExceededError

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("halcon-scraper")

SHARED_SECRET = os.environ.get("SCRAPER_SHARED_SECRET", "").strip()
if not SHARED_SECRET:
    logger.warning(
        "SCRAPER_SHARED_SECRET no configurado — el endpoint /scrape rechazará todo "
        "request hasta que se configure."
    )

app = FastAPI(
    title="HalcónOS Scraper",
    version="1.0.0",
    description="Microservicio de scraping con ScrapeGraph AI para HalcónOS.",
)

# El servicio NO se llama desde el navegador — solo desde el backend de HalcónOS.
# CORS restrictivo: solo permitimos el dominio de la app (vía env).
ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()
]
if ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_methods=["POST", "GET"],
        allow_headers=["*"],
    )


@app.get("/health")
async def health() -> dict:
    """
    Render usa esto para detectar liveness. Mantén ligero — no toca dependencias
    externas ni inicializa Playwright. Solo confirma que el proceso está vivo.
    """
    return {
        "status": "ok",
        "service": "halcon-scraper",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_endpoint(
    req: ScrapeRequest,
    x_scraper_secret: str | None = Header(default=None, alias="X-Scraper-Secret"),
) -> ScrapeResponse:
    # Auth — comparación constant-time básica.
    if not SHARED_SECRET or x_scraper_secret != SHARED_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Scraper-Secret header.",
        )

    logger.info(
        "POST /scrape source=%s query=%r city=%r max_results=%d",
        req.source,
        req.query,
        req.city,
        req.max_results,
    )

    try:
        # ScrapeGraph AI tiene operaciones sincrónicas pesadas (Playwright fetch + LLM).
        # Las movemos a un thread para no bloquear el event loop de FastAPI.
        results = await asyncio.to_thread(
            scrape,
            req.source,
            req.query,
            req.city,
            req.target_url,
            req.max_results,
        )
    except ValueError as e:
        # Input inválido (source no soportado, url faltante, etc.)
        logger.warning("Scrape validation error: %s", e)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))
    except QuotaExceededError as e:
        # 429 — cuota de Gemini agotada. El cliente Node mapea esto a un
        # mensaje específico ("agotaste tu cuota de IA, espera o activa billing").
        logger.warning("Gemini quota exhausted: %s", e)
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
        )
    except Exception as e:
        # Cualquier otra cosa: log + 502 para que Halcón muestre mensaje claro al user.
        logger.exception("Scrape failed: %s", e)
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"Scraping falló: {str(e)[:200]}",
        )

    return ScrapeResponse(
        results=results,
        source=req.source,
        scraped_at=datetime.now(timezone.utc).isoformat(),
        cached=False,
    )
