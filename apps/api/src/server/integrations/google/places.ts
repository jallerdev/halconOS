import { TRPCError } from '@trpc/server';

import { env } from '../../../env';

/**
 * Google Places API (New) integration — Text Search + Place Details.
 *
 * Doc: https://developers.google.com/maps/documentation/places/web-service/text-search
 *
 * Optimización de costo: field masking obligatorio en Places API New. Pedimos
 * solo lo que vamos a usar:
 *   - SEARCH_MASK = mínimo para renderizar el card en /discover.
 *   - DETAILS_MASK = todo lo necesario para crear un lead (incluye phone).
 *
 * Si no hay GOOGLE_PLACES_API_KEY → throw PRECONDITION_FAILED para que la UI
 * pueda mostrar un CTA "Configura tu API key".
 */

const PLACES_API_BASE = 'https://places.googleapis.com/v1';

// Campos mínimos para renderizar un PlaceCard (id, nombre, dirección, rating,
// reseñas, tipos, web, mapa, business status, price level). Cada campo extra
// suma a la factura → mantener corto.
const SEARCH_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.websiteUri',
  'places.businessStatus',
  'places.types',
  'places.priceLevel',
  'places.googleMapsUri',
].join(',');

// Campos para enriquecer al importar (phone + dirección desglosada).
const DETAILS_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'websiteUri',
  'businessStatus',
  'types',
  'priceLevel',
  'googleMapsUri',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
].join(',');

export type PlaceResult = {
  id: string;
  displayName?: string;
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  businessStatus?: string;
  types?: string[];
  priceLevel?: string;
  googleMapsUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
};

function ensureKey(): string {
  if (!env.GOOGLE_PLACES_API_KEY) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'GOOGLE_PLACES_API_KEY no configurada. Agrega la key en .env para usar Descubrir.',
    });
  }
  return env.GOOGLE_PLACES_API_KEY;
}

type SearchTextResponse = {
  places?: Array<PlaceResult & { displayName?: { text?: string; languageCode?: string } | string }>;
};

// La Places API devuelve displayName como objeto { text, languageCode }, pero
// nosotros guardamos el string directamente para simplificar el consumo.
function normalizeName(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && 'text' in v && typeof (v as { text: unknown }).text === 'string') {
    return (v as { text: string }).text;
  }
  return undefined;
}

function normalize(place: PlaceResult & { displayName?: unknown }): PlaceResult {
  return {
    ...place,
    displayName: normalizeName(place.displayName),
  };
}

export async function searchText(input: {
  query: string;
  city?: string;
  maxResults?: number;
}): Promise<PlaceResult[]> {
  const apiKey = ensureKey();
  const textQuery = input.city ? `${input.query} en ${input.city}` : input.query;

  const res = await fetch(`${PLACES_API_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': SEARCH_MASK,
    },
    body: JSON.stringify({
      textQuery,
      maxResultCount: Math.min(20, input.maxResults ?? 20),
      languageCode: 'es',
      regionCode: 'CO',
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new TRPCError({
      code: 'BAD_GATEWAY',
      message: `Google Places falló (${res.status}): ${text.slice(0, 300)}`,
    });
  }

  const json = (await res.json()) as SearchTextResponse;
  return (json.places ?? []).map(normalize);
}

export async function getDetails(placeId: string): Promise<PlaceResult> {
  const apiKey = ensureKey();
  const res = await fetch(`${PLACES_API_BASE}/places/${encodeURIComponent(placeId)}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': DETAILS_MASK,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new TRPCError({
      code: 'BAD_GATEWAY',
      message: `Google Places (details) falló (${res.status}): ${text.slice(0, 300)}`,
    });
  }
  const json = (await res.json()) as PlaceResult & { displayName?: unknown };
  return normalize(json);
}

// Normalización del cache key: lowercase + trim + collapse whitespace +
// remueve diacríticos (NFD). Garantiza que "Cafetería" y "cafeteria" matchean.
export function buildSearchKey(query: string, city?: string): string {
  const norm = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  return `${norm(query)}|${city ? norm(city) : ''}`;
}
