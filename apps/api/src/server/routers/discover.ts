import { TRPCError } from '@trpc/server';
import { and, eq, inArray, or } from 'drizzle-orm';
import { z } from 'zod';

import { can } from '@halcon-os/shared/rbac';

import { buildDedupeKey } from '../../lib/dedup';
import { discoveredPlaces, leads } from '../db/schema';
import {
  buildSearchKey,
  getDetails,
  searchText,
  type PlaceResult,
} from '../integrations/google/places';
import { scrapeViaPythonService } from '../integrations/scrape/client';
import { orgProcedure, router } from '../trpc';

const CACHE_TTL_HOURS = 24;

// Fuentes soportadas. `google` corre contra la API oficial de Places; el resto
// delega al microservicio Python (apps/scraper/) vía HTTP.
const SOURCES = [
  'google',
  'openstreetmap',
  'paginas-amarillas-co',
  'paginas-amarillas-mx',
  'paginas-amarillas-ar',
  'bing-search',
  'duckduckgo-search',
  'clutch',
  'workana',
  'fiverr',
  'behance',
  'dribbble',
] as const;
type Source = (typeof SOURCES)[number];

const searchInput = z.object({
  query: z.string().trim().min(2, 'La búsqueda necesita al menos 2 caracteres'),
  city: z.string().trim().min(1).optional(),
  source: z.enum(SOURCES).default('google'),
});

// Shape de un PlaceResult para validar `importPlaces`. Mantengo nullable/optional
// porque las fuentes scrapeadas no traen todos los campos.
const placeResultSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().optional(),
  formattedAddress: z.string().optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  rating: z.number().optional(),
  userRatingCount: z.number().int().optional(),
  websiteUri: z.string().optional(),
  businessStatus: z.string().optional(),
  types: z.array(z.string()).optional(),
  priceLevel: z.string().optional(),
  googleMapsUri: z.string().optional(),
  nationalPhoneNumber: z.string().optional(),
  internationalPhoneNumber: z.string().optional(),
});

// El frontend manda los places COMPLETOS (no solo IDs) porque para los scraped
// places no podemos llamar a `getDetails` de Google. Para Google places, el
// server igual re-fetchea details (frescos) para no depender del cache de
// 24h cuando el usuario ya decidió importarlo.
const importInput = z.object({
  places: z.array(placeResultSchema).min(1).max(50),
});

function buildSourcedSearchKey(source: Source, query: string, city?: string): string {
  return `${source}|${buildSearchKey(query, city)}`;
}

async function fetchPlaces(source: Source, query: string, city?: string): Promise<PlaceResult[]> {
  if (source === 'google') {
    return searchText({ query, city });
  }
  return scrapeViaPythonService({ source, query, city });
}

export const discoverRouter = router({
  // Busca lugares en la fuente solicitada (Google Places por default).
  // Primero consulta el cache global; si hay hit fresco (<24h) lo devuelve.
  // En miss/stale llama a la fuente real y guarda.
  //
  // El cache es GLOBAL (no per-org): los resultados son hechos del mundo, no
  // específicos de un tenant. La info per-org ("¿ya tengo este placeId?") se
  // resuelve aparte con `existingPlaceIds`.
  searchPlaces: orgProcedure.input(searchInput).query(async ({ ctx, input }) => {
    const searchKey = buildSourcedSearchKey(input.source, input.query, input.city);

    const [cached] = await ctx.db
      .select()
      .from(discoveredPlaces)
      .where(eq(discoveredPlaces.searchKey, searchKey))
      .limit(1);

    const cutoff = Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000;
    if (cached && cached.createdAt.getTime() >= cutoff) {
      return {
        results: cached.results as PlaceResult[],
        cached: true as const,
        cachedAt: cached.createdAt,
        source: input.source,
      };
    }

    const results = await fetchPlaces(input.source, input.query, input.city);

    // Upsert por searchKey: si había un row stale, sobreescribimos.
    if (cached) {
      await ctx.db
        .update(discoveredPlaces)
        .set({ results, createdAt: new Date() })
        .where(eq(discoveredPlaces.id, cached.id));
    } else {
      await ctx.db.insert(discoveredPlaces).values({ searchKey, results });
    }

    return { results, cached: false as const, source: input.source };
  }),

  // Importa lugares al CRM como leads NEW. Dedup en DOS niveles:
  //   1. Por (orgId, placeId) — mismo lead exacto de la misma fuente.
  //   2. Por (orgId, dedupeKey) — mismo lead entre fuentes distintas (Google
  //      Places vs OpenStreetMap vs Páginas Amarillas tienen placeIds distintos
  //      pero comparten nombre + dirección + teléfono).
  //
  // Reporta también `refetchFailed`: cuántos places usaron data cacheada
  // (UI) porque Google Places falló al refrescar details.
  importPlaces: orgProcedure.input(importInput).mutation(async ({ ctx, input }) => {
    const placeIds = input.places.map((p) => p.id);

    // Dedupes candidates (placeId + dedupeKey computado de los inputs).
    const inputDedupeKeys = input.places
      .map((p) =>
        buildDedupeKey({
          name: p.displayName ?? '',
          address: p.formattedAddress,
          phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber,
        }),
      )
      .filter((k): k is string => Boolean(k));

    const existing = await ctx.db
      .select({ placeId: leads.placeId, dedupeKey: leads.dedupeKey })
      .from(leads)
      .where(
        and(
          eq(leads.orgId, ctx.orgId),
          or(
            inArray(leads.placeId, placeIds),
            inputDedupeKeys.length > 0
              ? inArray(leads.dedupeKey, inputDedupeKeys)
              : eq(leads.placeId, '__never_matches__'),
          ),
        ),
      );

    const existingPlaceIds = new Set(
      existing.map((e) => e.placeId).filter((p): p is string => Boolean(p)),
    );
    const existingDedupeKeys = new Set(
      existing.map((e) => e.dedupeKey).filter((k): k is string => Boolean(k)),
    );

    const toImport = input.places.filter((p) => {
      if (existingPlaceIds.has(p.id)) return false;
      const k = buildDedupeKey({
        name: p.displayName ?? '',
        address: p.formattedAddress,
        phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber,
      });
      if (k && existingDedupeKeys.has(k)) return false;
      return true;
    });

    if (toImport.length === 0) {
      return { imported: 0, skipped: input.places.length, refetchFailed: 0 };
    }

    // Para Google placeIds, refrescamos details (más data fresca). Para scraped
    // places, usamos los datos que el frontend ya tiene en su state.
    // Contamos los que fallaron al refrescar para avisar al usuario.
    let refetchFailed = 0;
    const enriched: PlaceResult[] = await Promise.all(
      toImport.map(async (p) => {
        if (p.id.startsWith('scrape:')) return p;
        try {
          return await getDetails(p.id);
        } catch {
          refetchFailed += 1;
          return p; // Si falla el refresh, fallback a lo que envió la UI.
        }
      }),
    );

    // Auto-asignación: si quien descubre es seller, los leads quedan asignados
    // a él (para que los vea bajo el scope por rol). Admin → sin asignar.
    const assignedToId = can(ctx.role, 'leads.view.all') ? null : ctx.userId;

    const rows: typeof leads.$inferInsert[] = [];
    // Dentro del batch también dedupeamos — el LLM puede haber retornado el
    // mismo negocio dos veces (con diferente formato de nombre/dirección).
    const batchKeys = new Set<string>();

    for (const p of enriched) {
      if (!p.id || !p.displayName) continue;
      const sourceTag = p.id.startsWith('scrape:')
        ? p.id.split(':')[1] ?? 'scrape'
        : 'google_maps';
      const phone = p.nationalPhoneNumber ?? null;
      const dedupeKey = buildDedupeKey({
        name: p.displayName,
        address: p.formattedAddress,
        phone,
      });
      // Skip si este mismo batch ya incluyó el mismo dedupeKey.
      if (dedupeKey && batchKeys.has(dedupeKey)) continue;
      if (dedupeKey) batchKeys.add(dedupeKey);

      rows.push({
        orgId: ctx.orgId,
        ownerId: ctx.userId,
        assignedToId,
        businessName: p.displayName,
        phone,
        phoneIntl: p.internationalPhoneNumber ?? null,
        source: sourceTag,
        status: 'NEW',
        category: null,
        city: null,
        address: p.formattedAddress ?? null,
        googleRating: p.rating != null ? String(p.rating) : null,
        reviewCount: p.userRatingCount ?? null,
        hasWebsite: p.websiteUri ? true : false,
        websiteUrl: p.websiteUri ?? null,
        priceLevel: p.priceLevel ?? null,
        businessStatus: p.businessStatus ?? null,
        placeId: p.id,
        placeTypes: p.types ?? [],
        mapsUrl: p.googleMapsUri ?? null,
        latitude: p.location?.latitude != null ? String(p.location.latitude) : null,
        longitude: p.location?.longitude != null ? String(p.location.longitude) : null,
        scrapedAt: new Date(),
        dedupeKey,
      });
    }

    if (rows.length === 0) {
      throw new TRPCError({
        code: 'BAD_GATEWAY',
        message: 'No se pudo importar ningún lugar.',
      });
    }

    let imported = 0;
    await ctx.db.transaction(async (tx) => {
      const inserted = await tx.insert(leads).values(rows).returning({ id: leads.id });
      imported = inserted.length;
    });

    return {
      refetchFailed,
      imported,
      skipped: input.places.length - imported,
    };
  }),

  // Devuelve qué placeIds del set ya existen como leads en este org. Lo usa el
  // frontend para mostrar el badge "Ya en tu CRM" en las cards de Discover.
  existingPlaceIds: orgProcedure
    .input(z.object({ placeIds: z.array(z.string()).max(100) }))
    .query(async ({ ctx, input }) => {
      if (input.placeIds.length === 0) return { placeIds: [] as string[] };
      const rows = await ctx.db
        .select({ placeId: leads.placeId })
        .from(leads)
        .where(and(eq(leads.orgId, ctx.orgId), inArray(leads.placeId, input.placeIds)));
      return {
        placeIds: rows.map((r) => r.placeId).filter((p): p is string => Boolean(p)),
      };
    }),
});
