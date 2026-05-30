import { randomUUID } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, gte, sql } from 'drizzle-orm';
import { z } from 'zod';

import { idSchema, meetingScheduleSchema } from '@halcon-os/shared/schemas';

import { leads, tasks } from '~/server/db/schema';
import { getCalendarForUser } from '~/server/integrations/google/client';

import { orgProcedure, router } from '../trpc';

export const meetingsRouter = router({
  // Agenda una reunión sobre un lead: crea evento en Google Calendar con Meet
  // y registra una task con kind='meeting' apuntando al lead.
  schedule: orgProcedure.input(meetingScheduleSchema).mutation(async ({ ctx, input }) => {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Fechas inválidas.' });
    }
    if (endsAt <= startsAt) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'La hora de fin debe ser posterior al inicio.' });
    }
    if (startsAt.getTime() < Date.now() - 60_000) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'La reunión debe ser futura.' });
    }

    const [lead] = await ctx.db
      .select({ id: leads.id, businessName: leads.businessName })
      .from(leads)
      .where(and(eq(leads.id, input.leadId), eq(leads.orgId, ctx.orgId)))
      .limit(1);
    if (!lead) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead no encontrado.' });
    }

    const calendar = await getCalendarForUser(ctx.userId);
    const timeZone = input.timeZone || 'America/Bogota';

    let event;
    try {
      const res = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        sendUpdates: 'all',
        requestBody: {
          summary: input.title,
          description: input.description ?? undefined,
          start: { dateTime: startsAt.toISOString(), timeZone },
          end: { dateTime: endsAt.toISOString(), timeZone },
          attendees: (input.attendees ?? []).map((email) => ({ email })),
          conferenceData: {
            createRequest: {
              requestId: randomUUID(),
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        },
      });
      event = res.data;
    } catch (e) {
      const code = (e as { response?: { data?: { error?: string } } }).response?.data?.error;
      if (code === 'invalid_grant') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'La conexión con Google fue revocada. Reconéctala en Ajustes.',
        });
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: e instanceof Error ? e.message : 'No se pudo crear el evento en Google.',
      });
    }

    const [task] = await ctx.db
      .insert(tasks)
      .values({
        orgId: ctx.orgId,
        kind: 'meeting',
        leadId: lead.id,
        title: input.title,
        description: input.description ?? null,
        status: 'TODO',
        priority: 'MED',
        startsAt,
        endsAt,
        attendees: input.attendees ?? [],
        meetUrl: event.hangoutLink ?? null,
        googleEventId: event.id ?? null,
        googleCalendarId: 'primary',
      })
      .returning();

    if (!task) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }

    return { task, meetUrl: task.meetUrl };
  }),

  // Cancela una reunión: borra el evento en Google (si aún está conectado) y la task.
  cancel: orgProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    const [task] = await ctx.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, input.id), eq(tasks.orgId, ctx.orgId), eq(tasks.kind, 'meeting')))
      .limit(1);
    if (!task) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Reunión no encontrada.' });
    }

    let googleWarning: string | null = null;
    if (task.googleEventId) {
      try {
        const calendar = await getCalendarForUser(ctx.userId);
        await calendar.events.delete({
          calendarId: task.googleCalendarId ?? 'primary',
          eventId: task.googleEventId,
          sendUpdates: 'all',
        });
      } catch (e) {
        // Si Google falla (cuenta desconectada, evento ya borrado), seguimos
        // borrando la task local pero avisamos al usuario.
        googleWarning =
          e instanceof Error ? e.message : 'No se pudo borrar el evento en Google.';
      }
    }

    await ctx.db.delete(tasks).where(eq(tasks.id, task.id));

    return { ok: true, googleWarning };
  }),

  // Lista las reuniones de un lead (todas, ordenadas por fecha desc).
  listByLead: orgProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.orgId, ctx.orgId),
            eq(tasks.leadId, input.leadId),
            eq(tasks.kind, 'meeting'),
          ),
        )
        .orderBy(desc(tasks.startsAt));
    }),

  // Próximas reuniones del org (para /today).
  upcoming: orgProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      const rows = await ctx.db
        .select({
          id: tasks.id,
          title: tasks.title,
          startsAt: tasks.startsAt,
          endsAt: tasks.endsAt,
          meetUrl: tasks.meetUrl,
          leadId: tasks.leadId,
          leadName: leads.businessName,
        })
        .from(tasks)
        .leftJoin(leads, eq(tasks.leadId, leads.id))
        .where(
          and(
            eq(tasks.orgId, ctx.orgId),
            eq(tasks.kind, 'meeting'),
            gte(tasks.startsAt, sql`now()`),
          ),
        )
        .orderBy(asc(tasks.startsAt))
        .limit(limit);
      return rows;
    }),
});
