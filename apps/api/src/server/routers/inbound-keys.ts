import { createHash, randomBytes } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { idSchema } from '@halcon-os/shared/schemas';
import { inboundKeys } from '../db/schema';
import { adminProcedure, router } from '../trpc';

const KEY_PREFIX_LEN = 12;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export const inboundKeysRouter = router({
  // Lista las keys de la org actual (nunca expone el hash ni el secreto).
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: inboundKeys.id,
        name: inboundKeys.name,
        keyPrefix: inboundKeys.keyPrefix,
        lastUsedAt: inboundKeys.lastUsedAt,
        revokedAt: inboundKeys.revokedAt,
        createdAt: inboundKeys.createdAt,
      })
      .from(inboundKeys)
      .where(eq(inboundKeys.orgId, ctx.orgId))
      .orderBy(desc(inboundKeys.createdAt));
  }),

  // Genera una key nueva. Devuelve el secreto en claro UNA sola vez.
  create: adminProcedure
    .input(z.object({ name: z.string().trim().min(1).max(80) }))
    .mutation(async ({ ctx, input }) => {
      const secret = `lk_${randomBytes(24).toString('hex')}`;
      const [created] = await ctx.db
        .insert(inboundKeys)
        .values({
          orgId: ctx.orgId,
          ownerId: ctx.userId,
          name: input.name,
          keyHash: sha256(secret),
          keyPrefix: secret.slice(0, KEY_PREFIX_LEN),
        })
        .returning({ id: inboundKeys.id, name: inboundKeys.name, keyPrefix: inboundKeys.keyPrefix });
      if (!created) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      // `secret` solo se devuelve aquí; no se vuelve a poder leer.
      return { ...created, secret };
    }),

  // Revoca (soft) una key de la org actual.
  revoke: adminProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    const [updated] = await ctx.db
      .update(inboundKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(inboundKeys.id, input.id), eq(inboundKeys.orgId, ctx.orgId)))
      .returning({ id: inboundKeys.id });
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
    return updated;
  }),
});
