import { initTRPC, TRPCError } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { auth as clerkAuth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import superjson from 'superjson';
import { ZodError } from 'zod';

import { env } from '../env';
import { db } from './db';
import { users } from './db/schema';

const DEV_EXTERNAL_PREFIX = 'dev:';

async function resolveUserId(): Promise<string | null> {
  // Clerk es la fuente de verdad cuando está configurado (producción / auth real).
  if (env.CLERK_SECRET_KEY) {
    return resolveClerkUser();
  }
  // Fallback de desarrollo sin Clerk.
  if (env.DEV_BYPASS_USER_ID) {
    return ensureDevUser(env.DEV_BYPASS_USER_ID);
  }
  return null;
}

async function resolveClerkUser(): Promise<string | null> {
  const { userId: externalId } = await clerkAuth();
  if (!externalId) return null;

  const existing = await db.query.users.findFirst({
    where: eq(users.externalId, externalId),
  });
  if (existing) return existing.id;

  // Datos del usuario de Clerk para email/nombre.
  const cu = await currentUser();
  const email = cu?.primaryEmailAddress?.emailAddress ?? `${externalId}@clerk.local`;
  const name = cu?.fullName ?? null;

  // Primer login: si existe la cuenta "dev" legacy (dueña de los leads importados),
  // este usuario la RECLAMA — hereda todos los datos y queda como admin.
  const devUser = await db.query.users.findFirst({
    where: eq(users.externalId, `${DEV_EXTERNAL_PREFIX}${env.DEV_BYPASS_USER_ID || 'local'}`),
  });
  if (devUser) {
    const [claimed] = await db
      .update(users)
      .set({ externalId, email, name, role: 'admin' })
      .where(eq(users.id, devUser.id))
      .returning();
    return claimed?.id ?? null;
  }

  // Sin cuenta legacy: el primer usuario del sistema es admin, el resto sales.
  const anyUser = await db.query.users.findFirst();
  const [created] = await db
    .insert(users)
    .values({ email, name, externalId, role: anyUser ? 'sales' : 'admin' })
    .returning();
  return created?.id ?? null;
}

async function ensureDevUser(devKey: string): Promise<string> {
  const externalId = `dev:${devKey}`;
  const existing = await db.query.users.findFirst({
    where: eq(users.externalId, externalId),
  });
  if (existing) return existing.id;

  const [created] = await db
    .insert(users)
    .values({
      email: `${devKey}@dev.local`,
      name: 'Dev User',
      externalId,
    })
    .returning();
  if (!created) throw new Error('Failed to bootstrap dev user');
  return created.id;
}

const DEV_ORG_ID = 'dev-org';

async function resolveOrg(userId: string | null): Promise<{ orgId: string | null; orgRole: string | null }> {
  if (!env.CLERK_SECRET_KEY) {
    // En dev sin Clerk, una sola "org" sentinel.
    return { orgId: DEV_ORG_ID, orgRole: 'admin' };
  }
  const { orgId, orgRole } = await clerkAuth();
  if (orgId && userId) {
    // Adopta leads/proyectos/notas huérfanos (sin org) del usuario hacia su org activa.
    // Idempotente: tras la primera vez no matchea filas.
    await adoptOrphans(orgId, userId);
  }
  return { orgId: orgId ?? null, orgRole: orgRole ?? null };
}

async function adoptOrphans(orgId: string, userId: string) {
  const { leads, projects, notes } = await import('./db/schema');
  const { and, eq, isNull } = await import('drizzle-orm');
  await db.update(leads).set({ orgId }).where(and(eq(leads.ownerId, userId), isNull(leads.orgId)));
  await db
    .update(projects)
    .set({ orgId })
    .where(and(eq(projects.ownerId, userId), isNull(projects.orgId)));
  await db.update(notes).set({ orgId }).where(and(eq(notes.ownerId, userId), isNull(notes.orgId)));
}

export async function createContext(_opts: FetchCreateContextFnOptions) {
  const userId = await resolveUserId();
  const { orgId, orgRole } = await resolveOrg(userId);
  return { db, userId, orgId, orgRole };
}
export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

// Requiere usuario autenticado + organización activa. Todas las queries de datos
// se acotan por ctx.orgId (multi-tenant).
export const orgProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  if (!ctx.orgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Selecciona o crea una organización para continuar.',
    });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId, orgId: ctx.orgId } });
});

export const adminProcedure = orgProcedure.use(({ ctx, next }) => {
  if (ctx.orgRole !== 'org:admin' && ctx.orgRole !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Requiere rol de administrador.' });
  }
  return next({ ctx });
});
