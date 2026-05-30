import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { projects, tasks } from '../db/schema';
import { orgProcedure, router } from '../trpc';

export const tasksRouter = router({
  listByProject: orgProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [owned] = await ctx.db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, input.projectId), eq(projects.orgId, ctx.orgId)))
        .limit(1);
      if (!owned) return [];

      return ctx.db
        .select()
        .from(tasks)
        .where(and(eq(tasks.projectId, input.projectId), eq(tasks.kind, 'task')))
        .orderBy(asc(tasks.status), asc(tasks.position));
    }),
});
