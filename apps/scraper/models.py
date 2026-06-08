"""
Modelos Pydantic compartidos entre los endpoints y los scrapers.

`PlaceResult` mantiene EXACTAMENTE el mismo shape que la integración de Google Places en
HalcónOS (apps/api/src/server/integrations/google/places.ts → PlaceResult). Así el cliente
Node puede cachear los resultados de scraping en la misma tabla `discovered_places` y
el frontend renderiza el mismo `PlaceCard` para todas las fuentes.
"""

from typing import Optional
from pydantic import BaseModel, Field


class Location(BaseModel):
    latitude: float
    longitude: float


class PlaceResult(BaseModel):
    """Resultado normalizado: shape idéntico al de Google Places en HalcónOS."""

    id: str = Field(
        description=(
            "ID estable. Para fuentes no-Google, prefijar con `scrape:<source>:<hash>` "
            "para que no colisione con placeIds de Google Maps."
        )
    )
    displayName: Optional[str] = None
    formattedAddress: Optional[str] = None
    location: Optional[Location] = None
    rating: Optional[float] = None
    userRatingCount: Optional[int] = None
    websiteUri: Optional[str] = None
    businessStatus: Optional[str] = "OPERATIONAL"
    types: list[str] = []
    priceLevel: Optional[str] = None
    googleMapsUri: Optional[str] = None
    nationalPhoneNumber: Optional[str] = None
    internationalPhoneNumber: Optional[str] = None


class ScrapeRequest(BaseModel):
    source: str = Field(
        description=(
            "Identificador de la fuente. Valores soportados (v1):\n"
            "  - paginas-amarillas-co\n"
            "  - bing-search\n"
            "  - url (genérico: scrapea una URL provista en `target_url`)"
        )
    )
    query: str = Field(min_length=2, max_length=200)
    city: Optional[str] = Field(default=None, max_length=120)
    target_url: Optional[str] = Field(
        default=None,
        description="Solo aplica a source='url'. La URL específica a scrapear.",
    )
    max_results: int = Field(default=20, ge=1, le=50)


class ScrapeResponse(BaseModel):
    results: list[PlaceResult]
    source: str
    scraped_at: str
    cached: bool = False
