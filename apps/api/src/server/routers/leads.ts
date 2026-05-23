import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, getTableColumns, ilike, inArray, or, sql } from 'drizzle-orm';
import { z } from 'zod';

import { LEAD_STATUS } from '@agency-os/shared/enums';
import {
  aiGenerateSchema,
  bulkIdsSchema,
  bulkStatusSchema,
  idSchema,
  leadCreateSchema,
  leadSearchSchema,
  leadStatusUpdateSchema,
  leadUpdateSchema,
} from '@agency-os/shared/schemas';
import { buildPrompt } from '../ai/lead-prompts';
import { generateText, isAiConfigured } from '../ai/provider';
import { rateLimit } from '../rate-limit';
import { leads, notes } from '../db/schema';
import { orgProcedure, router } from '../trpc';

function parseSection(text: string, header: string): string | null {
  const re = new RegExp(`###\\s*${header}\\s*([\\s\\S]*?)(?=###|$)`, 'i');
  const m = text.match(re);
  return m && m[1] ? m[1].trim() : null;
}

/**
 * Score 0-100 de potencial de venta:
 *  - reseñas (0-55): log-escala, un negocio con muchas reseñas está establecido y tiene flujo.
 *  - rating   (0-30): reputación.
 *  - teléfono (0-15): contactable.
 * Se calcula en SQL para poder ordenar y mantenerlo siempre fresco.
 */
const scoreExpr = sql<number>`(
  least(55, coalesce(ln(${leads.reviewCount} + 1), 0) / ln(5000) * 55)
  + coalesce(${leads.googleRating}, 0) / 5.0 * 30
  + case when ${leads.phone} is not null then 15 else 0 end
)::int`;

function toDateOrNull(v: unknown): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'string') return new Date(v);
  return undefined;
}

export const leadsRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(leads)
      .where(eq(leads.orgId, ctx.orgId))
      .orderBy(desc(leads.updatedAt));
  }),

  byId: orgProcedure.input(idSchema).query(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select({ ...getTableColumns(leads), score: scoreExpr })
      .from(leads)
      .where(and(eq(leads.id, input.id), eq(leads.orgId, ctx.orgId)))
      .limit(1);
    return row ?? null;
  }),

  // Búsqueda paginada con filtros — para la web con miles de leads.
  search: orgProcedure.input(leadSearchSchema).query(async ({ ctx, input }) => {
    const conds = [eq(leads.orgId, ctx.orgId)];
    if (input.status) conds.push(eq(leads.status, input.status));
    if (input.city) conds.push(eq(leads.city, input.city));
    if (input.category) conds.push(eq(leads.category, input.category));
    if (input.hasWebsite !== undefined) conds.push(eq(leads.hasWebsite, input.hasWebsite));
    if (input.assignedToId) conds.push(eq(leads.assignedToId, input.assignedToId));
    if (input.q) {
      const pattern = `%${input.q}%`;
      const search = or(
        ilike(leads.businessName, pattern),
        ilike(leads.city, pattern),
        ilike(leads.category, pattern),
        ilike(leads.phone, pattern),
      );
      if (search) conds.push(search);
    }
    const where = and(...conds);

    const orderBy =
      input.sort === 'rating'
        ? [sql`${leads.googleRating} desc nulls last`, sql`${leads.reviewCount} desc nulls last`]
        : input.sort === 'reviews'
          ? [sql`${leads.reviewCount} desc nulls last`]
          : input.sort === 'name'
            ? [asc(leads.businessName)]
            : input.sort === 'score'
              ? [sql`${scoreExpr} desc nulls last`]
              : [desc(leads.updatedAt)];

    const rows = await ctx.db
      .select({ ...getTableColumns(leads), score: scoreExpr })
      .from(leads)
      .where(where)
      .orderBy(...orderBy)
      .limit(input.limit + 1)
      .offset(input.cursor);

    const hasMore = rows.length > input.limit;
    const items = hasMore ? rows.slice(0, input.limit) : rows;

    const countRows = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(leads)
      .where(where);

    return {
      items,
      total: countRows[0]?.count ?? 0,
      nextCursor: hasMore ? input.cursor + input.limit : null,
    };
  }),

  // Setear / limpiar el próximo seguimiento.
  setFollowUp: orgProcedure
    .input(
      z.object({
        id: idSchema.shape.id,
        date: z.string().datetime({ offset: true }).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(leads)
        .set({ nextFollowUpAt: input.date ? new Date(input.date) : null, updatedAt: new Date() })
        .where(and(eq(leads.id, input.id), eq(leads.orgId, ctx.orgId)))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      return updated;
    }),

  // Vista "Hoy": seguimientos vencidos, de hoy y próximos.
  followUps: orgProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ ...getTableColumns(leads), score: scoreExpr })
      .from(leads)
      .where(and(eq(leads.orgId, ctx.orgId), sql`${leads.nextFollowUpAt} is not null`))
      .orderBy(asc(leads.nextFollowUpAt))
      .limit(200);

    const now = new Date();
    const overdue: typeof rows = [];
    const today: typeof rows = [];
    const upcoming: typeof rows = [];
    for (const r of rows) {
      const d = r.nextFollowUpAt ? new Date(r.nextFollowUpAt) : null;
      if (!d) continue;
      const sameDay = d.toDateString() === now.toDateString();
      if (sameDay) today.push(r);
      else if (d < now) overdue.push(r);
      else upcoming.push(r);
    }
    return {
      overdue,
      today,
      upcoming,
      counts: { overdue: overdue.length, today: today.length, upcoming: upcoming.length },
    };
  }),

  // Pipeline Kanban: top N leads por estado + conteo total por columna.
  pipeline: orgProcedure
    .input(z.object({ perColumn: z.number().int().min(5).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const perColumn = input?.perColumn ?? 20;
      const owner = eq(leads.orgId, ctx.orgId);

      const counts = await ctx.db
        .select({ status: leads.status, count: sql<number>`count(*)::int` })
        .from(leads)
        .where(owner)
        .groupBy(leads.status);
      const countMap = Object.fromEntries(counts.map((c) => [c.status, c.count]));

      const columns = await Promise.all(
        LEAD_STATUS.map(async (status) => {
          const items = await ctx.db
            .select({ ...getTableColumns(leads), score: scoreExpr })
            .from(leads)
            .where(and(owner, eq(leads.status, status)))
            .orderBy(sql`${scoreExpr} desc nulls last`)
            .limit(perColumn);
          return { status, count: countMap[status] ?? 0, items };
        }),
      );
      return columns;
    }),

  // KPIs para las tarjetas del dashboard.
  stats: orgProcedure.query(async ({ ctx }) => {
    const owner = eq(leads.orgId, ctx.orgId);

    const [totals] = await ctx.db
      .select({
        total: sql<number>`count(*)::int`,
        nuevos: sql<number>`count(*) filter (where ${leads.status} = 'NEW')::int`,
        contactados: sql<number>`count(*) filter (where ${leads.status} <> 'NEW' and ${leads.status} <> 'LOST')::int`,
        ganados: sql<number>`count(*) filter (where ${leads.status} = 'WON')::int`,
        nuevosSemana: sql<number>`count(*) filter (where ${leads.createdAt} >= now() - interval '7 days')::int`,
        semanaPrevia: sql<number>`count(*) filter (where ${leads.createdAt} >= now() - interval '14 days' and ${leads.createdAt} < now() - interval '7 days')::int`,
      })
      .from(leads)
      .where(owner);

    // Sparkline: leads creados por día (últimos 14 días).
    const daily = await ctx.db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${leads.createdAt}), 'YYYY-MM-DD')`,
        n: sql<number>`count(*)::int`,
      })
      .from(leads)
      .where(and(owner, sql`${leads.createdAt} >= now() - interval '14 days'`))
      .groupBy(sql`date_trunc('day', ${leads.createdAt})`)
      .orderBy(sql`date_trunc('day', ${leads.createdAt})`);

    const t = totals ?? {
      total: 0,
      nuevos: 0,
      contactados: 0,
      ganados: 0,
      nuevosSemana: 0,
      semanaPrevia: 0,
    };

    const conversion = t.total > 0 ? Math.round((t.ganados / t.total) * 1000) / 10 : 0;
    const rawTrend =
      t.semanaPrevia > 0
        ? Math.round(((t.nuevosSemana - t.semanaPrevia) / t.semanaPrevia) * 100)
        : t.nuevosSemana > 0
          ? 100
          : 0;
    // Cap para no mostrar % absurdos cuando la base previa es ~0 (ej. import inicial).
    const trendNuevos = Math.max(-100, Math.min(100, rawTrend));

    return {
      total: t.total,
      nuevos: t.nuevos,
      contactados: t.contactados,
      ganados: t.ganados,
      nuevosSemana: t.nuevosSemana,
      trendNuevos,
      conversion,
      sparkline: daily.map((d) => d.n),
    };
  }),

  // Facetas para los filtros de la web (ciudades y sectores con conteo).
  facets: orgProcedure.query(async ({ ctx }) => {
    const cities = await ctx.db
      .select({ value: leads.city, count: sql<number>`count(*)::int` })
      .from(leads)
      .where(eq(leads.orgId, ctx.orgId))
      .groupBy(leads.city)
      .orderBy(desc(sql`count(*)`));

    const categories = await ctx.db
      .select({ value: leads.category, count: sql<number>`count(*)::int` })
      .from(leads)
      .where(eq(leads.orgId, ctx.orgId))
      .groupBy(leads.category)
      .orderBy(desc(sql`count(*)`));

    return {
      cities: cities.filter((c) => c.value),
      categories: categories.filter((c) => c.value),
    };
  }),

  create: orgProcedure.input(leadCreateSchema).mutation(async ({ ctx, input }) => {
    const [created] = await ctx.db
      .insert(leads)
      .values({
        orgId: ctx.orgId,
        ownerId: ctx.userId,
        businessName: input.businessName,
        contactName: input.contactName ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        source: input.source ?? null,
        estimatedValue: input.estimatedValue ?? null,
        status: input.status ?? 'NEW',
        tags: input.tags ?? [],
        nextFollowUpAt: toDateOrNull(input.nextFollowUpAt) ?? null,
      })
      .returning();
    if (!created) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    return created;
  }),

  update: orgProcedure.input(leadUpdateSchema).mutation(async ({ ctx, input }) => {
    const { id, ...rest } = input;

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (rest.businessName !== undefined) patch.businessName = rest.businessName;
    if (rest.contactName !== undefined) patch.contactName = rest.contactName;
    if (rest.phone !== undefined) patch.phone = rest.phone;
    if (rest.email !== undefined) patch.email = rest.email;
    if (rest.source !== undefined) patch.source = rest.source;
    if (rest.estimatedValue !== undefined) patch.estimatedValue = rest.estimatedValue;
    if (rest.status !== undefined) patch.status = rest.status;
    if (rest.tags !== undefined) patch.tags = rest.tags;
    if (rest.nextFollowUpAt !== undefined) {
      patch.nextFollowUpAt = toDateOrNull(rest.nextFollowUpAt);
    }

    const [updated] = await ctx.db
      .update(leads)
      .set(patch)
      .where(and(eq(leads.id, id), eq(leads.orgId, ctx.orgId)))
      .returning();
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
    return updated;
  }),

  // Marca contactado (al abrir WhatsApp). Solo avanza desde NEW; siempre sella lastContactedAt.
  markContacted: orgProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    const [lead] = await ctx.db
      .select({ status: leads.status })
      .from(leads)
      .where(and(eq(leads.id, input.id), eq(leads.orgId, ctx.orgId)))
      .limit(1);
    if (!lead) throw new TRPCError({ code: 'NOT_FOUND' });

    const [updated] = await ctx.db
      .update(leads)
      .set({
        status: lead.status === 'NEW' ? 'CONTACTED' : lead.status,
        lastContactedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(leads.id, input.id), eq(leads.orgId, ctx.orgId)))
      .returning();
    return updated;
  }),

  updateStatus: orgProcedure
    .input(leadStatusUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(leads)
        .set({ status: input.status, updatedAt: new Date() })
        .where(and(eq(leads.id, input.id), eq(leads.orgId, ctx.orgId)))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      return updated;
    }),

  // Genera contenido de venta con IA (Gemini) y lo guarda en el lead.
  generateAi: orgProcedure.input(aiGenerateSchema).mutation(async ({ ctx, input }) => {
    // Máx 15 generaciones por minuto por usuario (protege cuota/costo de Gemini).
    rateLimit(`ai:${ctx.userId}`, 15, 60_000);

    if (!isAiConfigured()) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'IA no configurada: agrega GEMINI_API_KEY en apps/api/.env.local.',
      });
    }

    const [lead] = await ctx.db
      .select()
      .from(leads)
      .where(and(eq(leads.id, input.id), eq(leads.orgId, ctx.orgId)))
      .limit(1);
    if (!lead) throw new TRPCError({ code: 'NOT_FOUND' });

    const { system, prompt } = buildPrompt(input.kind, lead);

    let text: string;
    try {
      text = await generateText({ system, prompt });
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.error('[generateAi]', e);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        // No filtrar detalles internos/de la API en producción.
        message:
          process.env.NODE_ENV === 'production'
            ? 'No se pudo generar el contenido. Intenta de nuevo.'
            : e instanceof Error
              ? e.message
              : 'Error generando con IA',
      });
    }

    const patch: Record<string, unknown> = { aiGeneratedAt: new Date(), updatedAt: new Date() };
    if (input.kind === 'strategy') {
      patch.aiSalesAngle = parseSection(text, 'ÁNGULO DE VENTA') ?? text;
      patch.aiPainPoints = parseSection(text, 'DOLORES DEL NEGOCIO');
      patch.aiSuggestedPage = parseSection(text, 'PÁGINA SUGERIDA');
    } else if (input.kind === 'proposal') {
      patch.aiProposal = text;
    } else if (input.kind === 'message') {
      patch.aiFirstMessage = text;
    } else {
      patch.aiLandingCopy = text;
    }

    const [updated] = await ctx.db
      .update(leads)
      .set(patch)
      .where(and(eq(leads.id, input.id), eq(leads.orgId, ctx.orgId)))
      .returning();
    return updated;
  }),

  // Acciones en lote — siempre acotadas por ownerId.
  bulkUpdateStatus: orgProcedure.input(bulkStatusSchema).mutation(async ({ ctx, input }) => {
    const res = await ctx.db
      .update(leads)
      .set({ status: input.status, updatedAt: new Date() })
      .where(and(eq(leads.orgId, ctx.orgId), inArray(leads.id, input.ids)))
      .returning({ id: leads.id });
    return { updated: res.length };
  }),

  bulkDelete: orgProcedure.input(bulkIdsSchema).mutation(async ({ ctx, input }) => {
    await ctx.db
      .delete(notes)
      .where(
        and(
          eq(notes.orgId, ctx.orgId),
          eq(notes.parentType, 'lead'),
          inArray(notes.parentId, input.ids),
        ),
      );
    const res = await ctx.db
      .delete(leads)
      .where(and(eq(leads.orgId, ctx.orgId), inArray(leads.id, input.ids)))
      .returning({ id: leads.id });
    return { deleted: res.length };
  }),

  delete: orgProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    // Borra notas asociadas (parent_type='lead') antes de borrar el lead.
    await ctx.db
      .delete(notes)
      .where(
        and(
          eq(notes.orgId, ctx.orgId),
          eq(notes.parentType, 'lead'),
          eq(notes.parentId, input.id),
        ),
      );

    const [deleted] = await ctx.db
      .delete(leads)
      .where(and(eq(leads.id, input.id), eq(leads.orgId, ctx.orgId)))
      .returning({ id: leads.id });
    if (!deleted) throw new TRPCError({ code: 'NOT_FOUND' });
    return deleted;
  }),
});
