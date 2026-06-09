import { TRPCError } from '@trpc/server';

import { env } from '../../../env';
import type { PlaceResult } from '../google/places';

/**
 * Cliente del microservicio Python (apps/scraper/) que corre en Render.
 *
 * Mismo shape de salida que la integración de Google Places — el cliente trata los
 * resultados uniformemente y los mete en el cache global `discovered_places`.
 *
 * Edge cases:
 *  - El servicio en Render free tier duerme tras 15 min sin tráfico → cold start ~30s.
 *    Por eso el timeout es 60s.
 *  - Si las env vars no están configuradas → PRECONDITION_FAILED para que la UI
 *    pueda mostrar un CTA "Configura el servicio de scraping".
 *  - Errores 4xx/5xx del servicio → BAD_GATEWAY con el mensaje upstream truncado.
 */

export type ScrapeSource =
  | 'openstreetmap'
  | 'paginas-amarillas-co'
  | 'paginas-amarillas-mx'
  | 'paginas-amarillas-ar'
  | 'bing-search'
  | 'duckduckgo-search'
  | 'computrabajo'
  | 'bumeran'
  | 'indeed'
  | 'linkedin-jobs'
  | 'workana'
  | 'url';

export type ScrapeInput = {
  source: ScrapeSource;
  query: string;
  city?: string;
  targetUrl?: string;
  maxResults?: number;
};

type ScrapeApiResponse = {
  results: PlaceResult[];
  source: string;
  scraped_at: string;
  cached: boolean;
};

export async function scrapeViaPythonService(input: ScrapeInput): Promise<PlaceResult[]> {
  if (!env.SCRAPER_SERVICE_URL || !env.SCRAPER_SHARED_SECRET) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message:
        'Microservicio de scraping no configurado. Configura SCRAPER_SERVICE_URL y SCRAPER_SHARED_SECRET en .env.',
    });
  }

  const url = `${env.SCRAPER_SERVICE_URL.replace(/\/+$/, '')}/scrape`;
  const body = JSON.stringify({
    source: input.source,
    query: input.query,
    city: input.city ?? null,
    target_url: input.targetUrl ?? null,
    max_results: input.maxResults ?? 20,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Scraper-Secret': env.SCRAPER_SHARED_SECRET,
      },
      body,
      // Render free tier cold start ~30s. Damos 60s de margen.
      signal: AbortSignal.timeout(60_000),
    });
  } catch (e) {
    // Network error / timeout. El servicio puede estar caído o despertando.
    throw new TRPCError({
      code: 'BAD_GATEWAY',
      message: `No se pudo conectar al servicio de scraping (${(e as Error).message}).`,
    });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new TRPCError({
      code: 'BAD_GATEWAY',
      message: `Servicio de scraping falló (${res.status}): ${text.slice(0, 300)}`,
    });
  }

  const json = (await res.json()) as ScrapeApiResponse;
  return json.results;
}
