import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import { env, googleConfigured } from '~/env';
import { db } from '~/server/db';
import { googleAccounts } from '~/server/db/schema';

import { decryptRefreshToken } from '../../crypto';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

function ensureConfigured() {
  if (!googleConfigured) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Integración con Google no configurada en el servidor.',
    });
  }
}

export function getOAuthClient(): OAuth2Client {
  ensureConfigured();
  return new google.auth.OAuth2({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_OAUTH_REDIRECT_URI,
  });
}

export async function disconnectGoogleAccount(userId: string): Promise<void> {
  const [row] = await db.select().from(googleAccounts).where(eq(googleAccounts.userId, userId));
  if (!row) return;
  try {
    const refresh = decryptRefreshToken({
      ciphertext: row.refreshToken,
      iv: row.refreshTokenIv,
      tag: row.refreshTokenTag,
    });
    const oauth = getOAuthClient();
    await oauth.revokeToken(refresh).catch(() => {
      // Si Google ya revocó el token por su lado, ignorar.
    });
  } catch {
    // Si no se pudo descifrar (clave rotada o corrupta), seguir y borrar la row igual.
  }
  await db.delete(googleAccounts).where(eq(googleAccounts.userId, userId));
}

// Devuelve un cliente de Calendar listo para usar para el usuario dado.
// Refresca el access token si está por expirar y persiste el nuevo expiry.
// Lanza PRECONDITION_FAILED si no hay cuenta conectada o si Google rechaza el refresh.
export async function getCalendarForUser(userId: string) {
  ensureConfigured();
  const [account] = await db.select().from(googleAccounts).where(eq(googleAccounts.userId, userId));
  if (!account) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Conecta tu cuenta de Google primero (Ajustes → Conexión con Google).',
    });
  }

  let refreshToken: string;
  try {
    refreshToken = decryptRefreshToken({
      ciphertext: account.refreshToken,
      iv: account.refreshTokenIv,
      tag: account.refreshTokenTag,
    });
  } catch {
    await db.delete(googleAccounts).where(eq(googleAccounts.userId, userId));
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'No se pudo desencriptar el token. Reconecta tu cuenta de Google.',
    });
  }

  const oauth = getOAuthClient();
  oauth.setCredentials({
    refresh_token: refreshToken,
    access_token: account.accessToken ?? undefined,
    expiry_date: account.expiresAt ? account.expiresAt.getTime() : undefined,
  });

  const needsRefresh =
    !account.accessToken ||
    !account.expiresAt ||
    account.expiresAt.getTime() < Date.now() + 60_000;

  if (needsRefresh) {
    try {
      const { credentials } = await oauth.refreshAccessToken();
      oauth.setCredentials(credentials);
      await db
        .update(googleAccounts)
        .set({
          accessToken: credentials.access_token ?? null,
          expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
          updatedAt: new Date(),
        })
        .where(eq(googleAccounts.userId, userId));
    } catch (e) {
      const code = (e as { response?: { data?: { error?: string } } }).response?.data?.error;
      if (code === 'invalid_grant') {
        await db.delete(googleAccounts).where(eq(googleAccounts.userId, userId));
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'La conexión con Google fue revocada. Reconéctala en Ajustes.',
        });
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'No se pudo refrescar el token de Google.',
      });
    }
  }

  return google.calendar({ version: 'v3', auth: oauth });
}
