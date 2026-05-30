import { eq } from 'drizzle-orm';

import { googleConfigured } from '~/env';
import { googleAccounts } from '~/server/db/schema';
import { disconnectGoogleAccount } from '~/server/google/client';

import { orgProcedure, router } from '../trpc';

export const googleRouter = router({
  // Estado de la conexión del usuario actual con Google.
  status: orgProcedure.query(async ({ ctx }) => {
    if (!googleConfigured) {
      return { configured: false as const, connected: false as const };
    }
    const [account] = await ctx.db
      .select({
        email: googleAccounts.email,
        expiresAt: googleAccounts.expiresAt,
        scopes: googleAccounts.scopes,
        createdAt: googleAccounts.createdAt,
      })
      .from(googleAccounts)
      .where(eq(googleAccounts.userId, ctx.userId));

    if (!account) {
      return { configured: true as const, connected: false as const };
    }
    return {
      configured: true as const,
      connected: true as const,
      email: account.email,
      expiresAt: account.expiresAt,
      scopes: account.scopes,
      connectedAt: account.createdAt,
    };
  }),

  // Desconecta la cuenta de Google: revoca el refresh token en Google y borra la row.
  disconnect: orgProcedure.mutation(async ({ ctx }) => {
    await disconnectGoogleAccount(ctx.userId);
    return { ok: true };
  }),
});
