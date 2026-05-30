import { createHash, randomBytes } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { idSchema } from '@halcon-os/shared/schemas';
import { env } from '~/env';
import { decryptSecret, encryptSecret } from '~/server/crypto';
import { inboundKeys } from '../db/schema';
import { adminProcedure, router } from '../trpc';

const KEY_PREFIX_LEN = 12;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function requireEncryptionKey() {
  if (!env.ENCRYPTION_KEY) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message:
        'ENCRYPTION_KEY no configurada en el servidor. Necesaria para guardar las keys de forma reveable.',
    });
  }
}

export const inboundKeysRouter = router({
  // Lista las keys de la org actual. Incluye flag `revealable` para que la UI
  // muestre/oculte el botón "ver" según si hay versión cifrada disponible.
  list: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: inboundKeys.id,
        name: inboundKeys.name,
        keyPrefix: inboundKeys.keyPrefix,
        keyEncrypted: inboundKeys.keyEncrypted,
        lastUsedAt: inboundKeys.lastUsedAt,
        revokedAt: inboundKeys.revokedAt,
        createdAt: inboundKeys.createdAt,
      })
      .from(inboundKeys)
      .where(eq(inboundKeys.orgId, ctx.orgId))
      .orderBy(desc(inboundKeys.createdAt));
    return rows.map(({ keyEncrypted, ...r }) => ({ ...r, revealable: keyEncrypted !== null }));
  }),

  // Genera una key nueva. Devuelve el secreto en claro UNA sola vez (en el toast)
  // y lo guarda cifrado AES-256-GCM para que el admin pueda revelarla después.
  create: adminProcedure
    .input(z.object({ name: z.string().trim().min(1).max(80) }))
    .mutation(async ({ ctx, input }) => {
      requireEncryptionKey();
      const secret = `lk_${randomBytes(24).toString('hex')}`;
      const enc = encryptSecret(secret);
      const [created] = await ctx.db
        .insert(inboundKeys)
        .values({
          orgId: ctx.orgId,
          ownerId: ctx.userId,
          name: input.name,
          keyHash: sha256(secret),
          keyPrefix: secret.slice(0, KEY_PREFIX_LEN),
          keyEncrypted: enc.ciphertext,
          keyEncryptedIv: enc.iv,
          keyEncryptedTag: enc.tag,
        })
        .returning({ id: inboundKeys.id, name: inboundKeys.name, keyPrefix: inboundKeys.keyPrefix });
      if (!created) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      return { ...created, secret };
    }),

  // Revela el secreto en claro de una key existente (solo admin de la org).
  // Falla si la key es legacy (sin versión cifrada) — el admin debe rotarla.
  reveal: adminProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    requireEncryptionKey();
    const [row] = await ctx.db
      .select({
        keyEncrypted: inboundKeys.keyEncrypted,
        keyEncryptedIv: inboundKeys.keyEncryptedIv,
        keyEncryptedTag: inboundKeys.keyEncryptedTag,
      })
      .from(inboundKeys)
      .where(and(eq(inboundKeys.id, input.id), eq(inboundKeys.orgId, ctx.orgId)))
      .limit(1);
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
    if (!row.keyEncrypted || !row.keyEncryptedIv || !row.keyEncryptedTag) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Esta key es legacy y no se puede revelar. Rótala para generar una nueva.',
      });
    }
    try {
      const secret = decryptSecret({
        ciphertext: row.keyEncrypted,
        iv: row.keyEncryptedIv,
        tag: row.keyEncryptedTag,
      });
      return { secret };
    } catch {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'No se pudo desencriptar. La ENCRYPTION_KEY puede haber cambiado.',
      });
    }
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
