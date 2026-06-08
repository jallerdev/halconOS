import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, getTableColumns, ilike, inArray, or, sql } from 'drizzle-orm';
import { z } from 'zod';

import { LEAD_STATUS } from '@halcon-os/shared/enums';
import {
  aiGenerateSchema,
  bulkAssignSchema,
  bulkIdsSchema,
  bulkImportRowSchema,
  bulkImportSchema,
  bulkStatusSchema,
  idSchema,
  leadAssignSchema,
  leadCreateSchema,
  leadSearchSchema,
  leadStatusUpdateSchema,
  leadUpdateSchema,
} from '@halcon-os/shared/schemas';
import { can, type AppRole, type Permission } from '@halcon-os/shared/rbac';
import { buildPrompt } from '../integrations/ai/lead-prompts';
import { generateText, isAiConfigured } from '../integrations/ai/provider';
import { rateLimit } from '../rate-limit';
import { leads, notes } from '../db/schema';
import { orgProcedure, permissionProcedure, router } from '../trpc';

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

type LeadCtx = { orgId: string; userId: string; role: AppRole };

/**
 * Scope de leads por rol (multi-tenant + RBAC):
 *  - admin (leads.view.all) → todos los leads de la org.
 *  - seller → solo los leads asignados a él (assignedToId = userId).
 * Se aplica tanto en lecturas como en mutaciones por id/bulk para que un
 * seller no pueda leer ni mutar leads ajenos aunque conozca el id.
 */
function leadScopeWhere(ctx: LeadCtx) {
  const base = eq(leads.orgId, ctx.orgId);
  if (can(ctx.role, 'leads.view.all')) return base;
  return and(base, eq(leads.assignedToId, ctx.userId));
}

/**
 * A quién auto-asignar un lead recién creado/importado:
 *  - admin → null (queda sin asignar; el admin ve todo igual).
 *  - seller → a sí mismo, para que lo vea bajo leadScopeWhere.
 */
function autoAssign(ctx: LeadCtx): string | null {
  return can(ctx.role, 'leads.view.all') ? null : ctx.userId;
}

const AI_PERM_BY_KIND = {
  strategy: 'leads.ai.strategy',
  proposal: 'leads.ai.proposal',
  message: 'leads.ai.message',
  landing: 'leads.ai.landing',
} as const satisfies Record<string, Permission>;

export const leadsRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(leads)
      .where(leadScopeWhere(ctx))
      .orderBy(desc(leads.updatedAt));
  }),

  byId: orgProcedure.input(idSchema).query(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select({ ...getTableColumns(leads), score: scoreExpr })
      .from(leads)
      .where(and(eq(leads.id, input.id), leadScopeWhere(ctx)))
      .limit(1);
    return row ?? null;
  }),

  // Búsqueda paginada con filtros — para la web con miles de leads.
  search: orgProcedure.input(leadSearchSchema).query(async ({ ctx, input }) => {
    const conds = [eq(leads.orgId, ctx.orgId)];
    // Seller: acota a sus leads asignados. Admin: ve toda la org.
    if (!can(ctx.role, 'leads.view.all')) conds.push(eq(leads.assignedToId, ctx.userId));
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
        .where(and(eq(leads.id, input.id), leadScopeWhere(ctx)))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      return updated;
    }),

  // Vista "Hoy": seguimientos vencidos, de hoy y próximos.
  followUps: orgProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ ...getTableColumns(leads), score: scoreExpr })
      .from(leads)
      .where(and(leadScopeWhere(ctx), sql`${leads.nextFollowUpAt} is not null`))
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
      const owner = leadScopeWhere(ctx);

      // Para la columna NEW del kanban solo cuentan los leads "promovidos"
      // (pipelinePromotedAt no nulo). El resto vive en /leads como inbox.
      // Para los demás status el filtro de promoción es irrelevante.
      const newColumnFilter = sql`${leads.pipelinePromotedAt} is not null`;

      const counts = await ctx.db
        .select({ status: leads.status, count: sql<number>`count(*)::int` })
        .from(leads)
        .where(
          and(
            owner,
            sql`(${leads.status} <> 'NEW' or ${leads.pipelinePromotedAt} is not null)`,
          ),
        )
        .groupBy(leads.status);
      const countMap = Object.fromEntries(counts.map((c) => [c.status, c.count]));

      // Aparte, el conteo de leads NEW que SIGUEN en el inbox (no promovidos).
      // Lo expongo como `inboxCount` para que el banner del kanban sepa
      // cuántos quedan sin mover.
      const inboxRows = await ctx.db
        .select({ inboxCount: sql<number>`count(*)::int` })
        .from(leads)
        .where(and(owner, eq(leads.status, 'NEW'), sql`${leads.pipelinePromotedAt} is null`));
      const inboxCount = inboxRows[0]?.inboxCount ?? 0;

      const columns = await Promise.all(
        LEAD_STATUS.map(async (status) => {
          const extraFilter = status === 'NEW' ? newColumnFilter : sql`true`;
          const items = await ctx.db
            .select({ ...getTableColumns(leads), score: scoreExpr })
            .from(leads)
            .where(and(owner, eq(leads.status, status), extraFilter))
            .orderBy(sql`${scoreExpr} desc nulls last`)
            .limit(perColumn);
          return { status, count: countMap[status] ?? 0, items };
        }),
      );
      return { columns, inboxCount };
    }),

  // KPIs para las tarjetas del dashboard.
  // Devuelve 4 sparklines de 14 días para que cada KPI tenga su propia mini-curva
  // (estilo Tremor uniforme): total cumulativo, nuevos por día, contactados
  // cumulativo, y ganados cumulativo. También deltas semana vs semana para los
  // BadgeDelta de tendencia.
  stats: orgProcedure.query(async ({ ctx }) => {
    const owner = leadScopeWhere(ctx);

    const [totals] = await ctx.db
      .select({
        total: sql<number>`count(*)::int`,
        nuevos: sql<number>`count(*) filter (where ${leads.status} = 'NEW')::int`,
        contactados: sql<number>`count(*) filter (where ${leads.status} <> 'NEW' and ${leads.status} <> 'LOST')::int`,
        ganados: sql<number>`count(*) filter (where ${leads.status} = 'WON')::int`,
        nuevosSemana: sql<number>`count(*) filter (where ${leads.createdAt} >= now() - interval '7 days')::int`,
        semanaPrevia: sql<number>`count(*) filter (where ${leads.createdAt} >= now() - interval '14 days' and ${leads.createdAt} < now() - interval '7 days')::int`,
        contactadosSemana: sql<number>`count(*) filter (where ${leads.lastContactedAt} >= now() - interval '7 days')::int`,
        contactadosPrevia: sql<number>`count(*) filter (where ${leads.lastContactedAt} >= now() - interval '14 days' and ${leads.lastContactedAt} < now() - interval '7 days')::int`,
      })
      .from(leads)
      .where(owner);

    // Baseline: cuántos leads existían ANTES de los últimos 14 días.
    const [baseline] = await ctx.db
      .select({
        total: sql<number>`count(*)::int`,
        contactados: sql<number>`count(*) filter (where ${leads.lastContactedAt} is not null)::int`,
        ganados: sql<number>`count(*) filter (where ${leads.convertedAt} is not null)::int`,
      })
      .from(leads)
      .where(and(owner, sql`${leads.createdAt} < now() - interval '14 days'`));

    // Daily new leads (últimos 14 días) — base para el sparkline de NUEVOS y
    // para construir el cumulativo de TOTAL.
    const dailyNew = await ctx.db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${leads.createdAt}), 'YYYY-MM-DD')`,
        n: sql<number>`count(*)::int`,
      })
      .from(leads)
      .where(and(owner, sql`${leads.createdAt} >= now() - interval '14 days'`))
      .groupBy(sql`date_trunc('day', ${leads.createdAt})`)
      .orderBy(sql`date_trunc('day', ${leads.createdAt})`);

    const dailyContacted = await ctx.db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${leads.lastContactedAt}), 'YYYY-MM-DD')`,
        n: sql<number>`count(*)::int`,
      })
      .from(leads)
      .where(
        and(
          owner,
          sql`${leads.lastContactedAt} is not null and ${leads.lastContactedAt} >= now() - interval '14 days'`,
        ),
      )
      .groupBy(sql`date_trunc('day', ${leads.lastContactedAt})`)
      .orderBy(sql`date_trunc('day', ${leads.lastContactedAt})`);

    const dailyWon = await ctx.db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${leads.convertedAt}), 'YYYY-MM-DD')`,
        n: sql<number>`count(*)::int`,
      })
      .from(leads)
      .where(
        and(
          owner,
          sql`${leads.convertedAt} is not null and ${leads.convertedAt} >= now() - interval '14 days'`,
        ),
      )
      .groupBy(sql`date_trunc('day', ${leads.convertedAt})`)
      .orderBy(sql`date_trunc('day', ${leads.convertedAt})`);

    const t = totals ?? {
      total: 0,
      nuevos: 0,
      contactados: 0,
      ganados: 0,
      nuevosSemana: 0,
      semanaPrevia: 0,
      contactadosSemana: 0,
      contactadosPrevia: 0,
    };
    const b = baseline ?? { total: 0, contactados: 0, ganados: 0 };

    const conversion = t.total > 0 ? Math.round((t.ganados / t.total) * 1000) / 10 : 0;

    function trendPct(curr: number, prev: number): number {
      const raw =
        prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;
      return Math.max(-100, Math.min(100, raw));
    }
    const trendNuevos = trendPct(t.nuevosSemana, t.semanaPrevia);
    const trendContactados = trendPct(t.contactadosSemana, t.contactadosPrevia);

    // Reconstruye un array de 14 valores ordenado por día calendario, con
    // cumulativo opcional sobre `baseline`. Días sin actividad quedan en 0
    // (no se acumulan si `cumulative === false`).
    function buildDailyArray(
      rows: { day: string; n: number }[],
      baseline: number,
      cumulative: boolean,
    ): number[] {
      const map = new Map(rows.map((r) => [r.day, r.n]));
      const result: number[] = [];
      let running = baseline;
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const v = map.get(key) ?? 0;
        if (cumulative) {
          running += v;
          result.push(running);
        } else {
          result.push(v);
        }
      }
      return result;
    }

    return {
      total: t.total,
      nuevos: t.nuevos,
      contactados: t.contactados,
      ganados: t.ganados,
      nuevosSemana: t.nuevosSemana,
      trendNuevos,
      trendContactados,
      conversion,
      // Sparkline de tendencia para cada KPI (14 días).
      totalSparkline: buildDailyArray(dailyNew, b.total, true),
      nuevosSparkline: buildDailyArray(dailyNew, 0, false),
      contactadosSparkline: buildDailyArray(dailyContacted, b.contactados, true),
      ganadosSparkline: buildDailyArray(dailyWon, b.ganados, true),
    };
  }),

  // Facetas para los filtros de la web (ciudades y sectores con conteo).
  facets: orgProcedure.query(async ({ ctx }) => {
    const cities = await ctx.db
      .select({ value: leads.city, count: sql<number>`count(*)::int` })
      .from(leads)
      .where(leadScopeWhere(ctx))
      .groupBy(leads.city)
      .orderBy(desc(sql`count(*)`));

    const categories = await ctx.db
      .select({ value: leads.category, count: sql<number>`count(*)::int` })
      .from(leads)
      .where(leadScopeWhere(ctx))
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
        assignedToId: autoAssign(ctx),
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

  // Importa un chunk de leads desde la UI de CSV/XLSX. Valida fila a fila y
  // deduplica contra leads existentes de la org por email/teléfono.
  bulkImport: orgProcedure.input(bulkImportSchema).mutation(async ({ ctx, input }) => {
    const parsed: { row: ReturnType<typeof bulkImportRowSchema.parse>; index: number }[] = [];
    const errors: { rowIndex: number; message: string }[] = [];

    input.rows.forEach((raw, i) => {
      const result = bulkImportRowSchema.safeParse(raw);
      if (result.success) {
        parsed.push({ row: result.data, index: i });
      } else {
        errors.push({
          rowIndex: i,
          message: result.error.issues.map((iss) => `${iss.path.join('.') || 'fila'}: ${iss.message}`).join('; '),
        });
      }
    });

    if (!parsed.length) {
      return { created: 0, skippedDuplicates: 0, errors };
    }

    const emails = Array.from(
      new Set(parsed.map((p) => p.row.email).filter((e): e is string => Boolean(e))),
    );
    const phones = Array.from(
      new Set(parsed.map((p) => p.row.phone).filter((p): p is string => Boolean(p))),
    );

    const existing = await ctx.db
      .select({ email: leads.email, phone: leads.phone })
      .from(leads)
      .where(
        and(
          eq(leads.orgId, ctx.orgId),
          or(
            emails.length ? inArray(leads.email, emails) : sql`false`,
            phones.length ? inArray(leads.phone, phones) : sql`false`,
          ),
        ),
      );

    const existingEmails = new Set(existing.map((e) => e.email).filter(Boolean));
    const existingPhones = new Set(existing.map((e) => e.phone).filter(Boolean));

    const toInsert: typeof leads.$inferInsert[] = [];
    let skippedDuplicates = 0;

    // Dedup dentro del batch también (mismo email/teléfono dos veces en el CSV).
    const batchEmails = new Set<string>();
    const batchPhones = new Set<string>();

    // Auto-asignación: si quien importa es seller, sus filas quedan asignadas a él.
    const assignedToId = autoAssign(ctx);

    for (const { row } of parsed) {
      const email = row.email ?? null;
      const phone = row.phone ?? null;
      const dupEmail = email && (existingEmails.has(email) || batchEmails.has(email));
      const dupPhone = phone && (existingPhones.has(phone) || batchPhones.has(phone));
      if (dupEmail || dupPhone) {
        skippedDuplicates += 1;
        continue;
      }
      if (email) batchEmails.add(email);
      if (phone) batchPhones.add(phone);

      toInsert.push({
        orgId: ctx.orgId,
        ownerId: ctx.userId,
        assignedToId,
        businessName: row.businessName,
        contactName: row.contactName ?? null,
        phone,
        email,
        source: row.source ?? null,
        estimatedValue: row.estimatedValue ?? null,
        status: row.status ?? 'NEW',
        tags: row.tags ?? [],
      });
    }

    let created = 0;
    if (toInsert.length) {
      await ctx.db.transaction(async (tx) => {
        const inserted = await tx.insert(leads).values(toInsert).returning({ id: leads.id });
        created = inserted.length;
      });
    }

    return { created, skippedDuplicates, errors };
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
      .where(and(eq(leads.id, id), leadScopeWhere(ctx)))
      .returning();
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
    return updated;
  }),

  // Marca contactado (al abrir WhatsApp). Solo avanza desde NEW; siempre sella lastContactedAt.
  markContacted: orgProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    const [lead] = await ctx.db
      .select({ status: leads.status })
      .from(leads)
      .where(and(eq(leads.id, input.id), leadScopeWhere(ctx)))
      .limit(1);
    if (!lead) throw new TRPCError({ code: 'NOT_FOUND' });

    const [updated] = await ctx.db
      .update(leads)
      .set({
        status: lead.status === 'NEW' ? 'CONTACTED' : lead.status,
        lastContactedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(leads.id, input.id), leadScopeWhere(ctx)))
      .returning();
    return updated;
  }),

  updateStatus: orgProcedure
    .input(leadStatusUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(leads)
        .set({ status: input.status, updatedAt: new Date() })
        .where(and(eq(leads.id, input.id), leadScopeWhere(ctx)))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      return updated;
    }),

  // Pasa un lead NEW del inbox al kanban (columna "Por contactar"). Solo
  // sella el timestamp — el status sigue siendo NEW. Si el lead ya tiene
  // otro status, este endpoint es idempotente (no hace nada útil pero no
  // rompe).
  promoteToPipeline: orgProcedure
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(leads)
        .set({ pipelinePromotedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(leads.id, input.id), leadScopeWhere(ctx)))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      return updated;
    }),

  // Devuelve un lead del kanban al inbox. Solo limpia el timestamp.
  removeFromPipeline: orgProcedure
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(leads)
        .set({ pipelinePromotedAt: null, updatedAt: new Date() })
        .where(and(eq(leads.id, input.id), leadScopeWhere(ctx)))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      return updated;
    }),

  // Genera contenido de venta con IA (Gemini) y lo guarda en el lead.
  generateAi: orgProcedure.input(aiGenerateSchema).mutation(async ({ ctx, input }) => {
    // Gating por kind: el permiso depende del input runtime, así que va dentro
    // del handler (no se puede expresar con permissionProcedure). El seller solo
    // puede strategy/proposal/message; landing es admin-only.
    if (!can(ctx.role, AI_PERM_BY_KIND[input.kind])) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No tienes permiso para generar este tipo de contenido.',
      });
    }

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
      .where(and(eq(leads.id, input.id), leadScopeWhere(ctx)))
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
      .where(and(eq(leads.id, input.id), leadScopeWhere(ctx)))
      .returning();
    return updated;
  }),

  // Asigna / reasigna un lead a un miembro de la org (o desasigna con null).
  // Solo quien tiene leads.assign (admin).
  assign: permissionProcedure('leads.assign')
    .input(leadAssignSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(leads)
        .set({ assignedToId: input.assignedToId, updatedAt: new Date() })
        .where(and(eq(leads.id, input.id), eq(leads.orgId, ctx.orgId)))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      return updated;
    }),

  bulkAssign: permissionProcedure('leads.assign')
    .input(bulkAssignSchema)
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.db
        .update(leads)
        .set({ assignedToId: input.assignedToId, updatedAt: new Date() })
        .where(and(eq(leads.orgId, ctx.orgId), inArray(leads.id, input.ids)))
        .returning({ id: leads.id });
      return { assigned: res.length };
    }),

  // Acciones en lote — acotadas por el scope del rol.
  bulkUpdateStatus: orgProcedure.input(bulkStatusSchema).mutation(async ({ ctx, input }) => {
    const res = await ctx.db
      .update(leads)
      .set({ status: input.status, updatedAt: new Date() })
      .where(and(leadScopeWhere(ctx), inArray(leads.id, input.ids)))
      .returning({ id: leads.id });
    return { updated: res.length };
  }),

  // Promueve N leads NEW al kanban "Por contactar" de una sola vez.
  // Idempotente — leads ya promovidos solo refrescan su timestamp.
  bulkPromoteToPipeline: orgProcedure
    .input(bulkIdsSchema)
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.db
        .update(leads)
        .set({ pipelinePromotedAt: new Date(), updatedAt: new Date() })
        .where(and(leadScopeWhere(ctx), inArray(leads.id, input.ids)))
        .returning({ id: leads.id });
      return { updated: res.length };
    }),

  // Devuelve N leads del kanban al inbox.
  bulkRemoveFromPipeline: orgProcedure
    .input(bulkIdsSchema)
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.db
        .update(leads)
        .set({ pipelinePromotedAt: null, updatedAt: new Date() })
        .where(and(leadScopeWhere(ctx), inArray(leads.id, input.ids)))
        .returning({ id: leads.id });
      return { updated: res.length };
    }),

  bulkDelete: permissionProcedure('leads.delete').input(bulkIdsSchema).mutation(async ({ ctx, input }) => {
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

  delete: permissionProcedure('leads.delete').input(idSchema).mutation(async ({ ctx, input }) => {
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
