import { clerkClient } from '@clerk/nextjs/server';
import { inArray } from 'drizzle-orm';

import { users } from '../db/schema';
import { permissionProcedure, router } from '../trpc';

// Miembros de la organización activa — para el selector de asignación de leads.
// Solo accesible para quien tiene `members.view` (admin).
export const membersRouter = router({
  list: permissionProcedure('members.view').query(async ({ ctx }) => {
    // Dev sin Clerk: no hay membership real; devolver al menos el propio usuario.
    if (!process.env.CLERK_SECRET_KEY) {
      const me = await ctx.db.query.users.findFirst();
      return me
        ? [{ id: me.id, name: me.name, email: me.email, orgRole: 'org:admin' as string | null }]
        : [];
    }

    const cc = await clerkClient();
    const { data } = await cc.organizations.getOrganizationMembershipList({
      organizationId: ctx.orgId,
      limit: 100,
    });

    // Clerk userId == users.externalId. Solo son asignables los miembros que
    // ya tienen fila en `users` (es decir, que ya iniciaron sesión al menos una
    // vez — la fila se crea en el primer login, ver server/trpc.ts).
    const externalIds = data
      .map((m) => m.publicUserData?.userId)
      .filter((x): x is string => Boolean(x));
    if (externalIds.length === 0) return [];

    const rows = await ctx.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        externalId: users.externalId,
      })
      .from(users)
      .where(inArray(users.externalId, externalIds));

    const roleByExternalId = new Map(
      data.map((m) => [m.publicUserData?.userId, m.role] as const),
    );

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      orgRole: (r.externalId ? roleByExternalId.get(r.externalId) : null) ?? null,
    }));
  }),
});
