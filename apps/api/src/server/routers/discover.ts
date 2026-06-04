import { TRPCError } from '@trpc/server';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { discoveredPlaces, leads } from '../db/schema';
import {
  buildSearchKey,
  getDetails,
  searchText,
  type PlaceResult,
} from '../integrations/google/places';
import { orgProcedure, router } from '../trpc';

const CACHE_TTL_HOURS = 24;

const searchInput = z.object({
  query: z.string().trim().min(2, 'La búsqueda necesita al menos 2 caracteres'),
  city: z.string().trim().min(1).optional(),
});

const importInput = z.object({
  placeIds: z.array(z.string().min(1)).min(1).max(50),
});

export const discoverRouter = router({
  // Busca lugares en Google Places (Text Search). Primero consulta el cache;
  // si hay hit fresco (<24h) lo devuelve sin gastar API. En miss/stale llama
  // a la API y guarda el resultado.
  //
  // El cache es GLOBAL (no per-org): los resultados de Places son hechos del
  // mundo, no específicos de un tenant. La info per-org ("¿ya tengo este
  // placeId?") se resuelve por separado en el frontend con leads.byPlaceIds.
  searchPlaces: orgProcedure.input(searchInput).query(async ({ ctx, input }) => {
    const searchKey = buildSearchKey(input.query, input.city);

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
      };
    }

    const results = await searchText({ query: input.query, city: input.city });

    // Upsert por searchKey: si había un row stale, sobreescribimos.
    if (cached) {
      await ctx.db
        .update(discoveredPlaces)
        .set({ results, createdAt: new Date() })
        .where(eq(discoveredPlaces.id, cached.id));
    } else {
      await ctx.db.insert(discoveredPlaces).values({ searchKey, results });
    }

    return { results, cached: false as const };
  }),

  // Importa lugares al CRM como leads NEW con source='google_maps'.
  // Dedup por (orgId, placeId) — si ya existe el lead, lo saltamos.
  // Por cada placeId nuevo hacemos getDetails para tener phone/details frescos
  // (la búsqueda inicial no trae phone para minimizar campos pagos).
  importPlaces: orgProcedure.input(importInput).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .select({ placeId: leads.placeId })
      .from(leads)
      .where(and(eq(leads.orgId, ctx.orgId), inArray(leads.placeId, input.placeIds)));

    const existingSet = new Set(existing.map((e) => e.placeId).filter((p): p is string => Boolean(p)));
    const toFetch = input.placeIds.filter((id) => !existingSet.has(id));

    if (toFetch.length === 0) {
      return { imported: 0, skipped: input.placeIds.length };
    }

    // Fetch details en paralelo. Si alguno falla, lo descartamos del batch.
    const details = await Promise.allSettled(toFetch.map((id) => getDetails(id)));

    const rows: typeof leads.$inferInsert[] = [];
    for (const r of details) {
      if (r.status !== 'fulfilled') continue;
      const p = r.value;
      if (!p.id || !p.displayName) continue;
      rows.push({
        orgId: ctx.orgId,
        ownerId: ctx.userId,
        businessName: p.displayName,
        phone: p.nationalPhoneNumber ?? null,
        phoneIntl: p.internationalPhoneNumber ?? null,
        source: 'google_maps',
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
      });
    }

    if (rows.length === 0) {
      throw new TRPCError({
        code: 'BAD_GATEWAY',
        message: 'No se pudo importar ningún lugar (todos los detalles fallaron).',
      });
    }

    let imported = 0;
    await ctx.db.transaction(async (tx) => {
      const inserted = await tx.insert(leads).values(rows).returning({ id: leads.id });
      imported = inserted.length;
    });

    return {
      imported,
      skipped: input.placeIds.length - imported,
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
