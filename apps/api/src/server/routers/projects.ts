import { and, desc, eq } from 'drizzle-orm';

import { idSchema } from '@agency-os/shared/schemas';
import { projects } from '../db/schema';
import { orgProcedure, router } from '../trpc';

export const projectsRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(projects)
      .where(eq(projects.orgId, ctx.orgId))
      .orderBy(desc(projects.updatedAt));
  }),

  byId: orgProcedure.input(idSchema).query(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select()
      .from(projects)
      .where(and(eq(projects.id, input.id), eq(projects.orgId, ctx.orgId)))
      .limit(1);
    return row ?? null;
  }),
});
