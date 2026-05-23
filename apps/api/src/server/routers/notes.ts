import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';

import {
  idSchema,
  noteCreateSchema,
  noteUpdateSchema,
  parentRefSchema,
} from '@agency-os/shared/schemas';
import { notes } from '../db/schema';
import { orgProcedure, router } from '../trpc';

export const notesRouter = router({
  listByParent: orgProcedure.input(parentRefSchema).query(async ({ ctx, input }) => {
    return ctx.db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.orgId, ctx.orgId),
          eq(notes.parentType, input.parentType),
          eq(notes.parentId, input.parentId),
        ),
      )
      .orderBy(desc(notes.createdAt));
  }),

  create: orgProcedure.input(noteCreateSchema).mutation(async ({ ctx, input }) => {
    const [created] = await ctx.db
      .insert(notes)
      .values({
        orgId: ctx.orgId,
        ownerId: ctx.userId,
        parentType: input.parentType,
        parentId: input.parentId,
        body: input.body,
      })
      .returning();
    if (!created) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    return created;
  }),

  update: orgProcedure.input(noteUpdateSchema).mutation(async ({ ctx, input }) => {
    const [updated] = await ctx.db
      .update(notes)
      .set({ body: input.body, updatedAt: new Date() })
      .where(and(eq(notes.id, input.id), eq(notes.orgId, ctx.orgId)))
      .returning();
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
    return updated;
  }),

  delete: orgProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    const [deleted] = await ctx.db
      .delete(notes)
      .where(and(eq(notes.id, input.id), eq(notes.orgId, ctx.orgId)))
      .returning({ id: notes.id });
    if (!deleted) throw new TRPCError({ code: 'NOT_FOUND' });
    return deleted;
  }),
});
