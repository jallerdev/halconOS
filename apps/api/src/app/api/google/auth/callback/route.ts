import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

import { googleConfigured } from '~/env';
import { db } from '~/server/db';
import { googleAccounts, users } from '~/server/db/schema';
import { encryptRefreshToken, verifyOAuthState } from '~/server/google/crypto';
import { getOAuthClient } from '~/server/google/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function settingsRedirect(req: Request, params: Record<string, string>) {
  const url = new URL('/settings', req.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.hash = 'google';
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  if (!googleConfigured) {
    return NextResponse.json(
      { error: 'Integración con Google no configurada.' },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  if (errorParam) {
    return settingsRedirect(req, { google: 'error', reason: errorParam });
  }
  if (!code || !state) {
    return settingsRedirect(req, { google: 'error', reason: 'missing_params' });
  }

  const payload = verifyOAuthState(state);
  if (!payload) {
    return settingsRedirect(req, { google: 'error', reason: 'invalid_state' });
  }

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId || clerkUserId !== payload.userId) {
    return settingsRedirect(req, { google: 'error', reason: 'user_mismatch' });
  }

  // Resuelve el user local por externalId (Clerk id).
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.externalId, clerkUserId));
  if (!user) {
    return settingsRedirect(req, { google: 'error', reason: 'user_not_found' });
  }

  const oauth = getOAuthClient();
  let tokens;
  try {
    const { tokens: t } = await oauth.getToken(code);
    tokens = t;
  } catch {
    return settingsRedirect(req, { google: 'error', reason: 'token_exchange_failed' });
  }
  if (!tokens.refresh_token) {
    return settingsRedirect(req, { google: 'error', reason: 'no_refresh_token' });
  }

  oauth.setCredentials(tokens);
  let email = '';
  try {
    const userInfo = await google.oauth2({ version: 'v2', auth: oauth }).userinfo.get();
    email = userInfo.data.email ?? '';
  } catch {
    // sin email no podemos identificar la cuenta — fallback al userInfo del token
  }

  const enc = encryptRefreshToken(tokens.refresh_token);
  const scopes =
    typeof tokens.scope === 'string'
      ? tokens.scope.split(/\s+/).filter(Boolean)
      : [];

  await db
    .insert(googleAccounts)
    .values({
      userId: user.id,
      email,
      accessToken: tokens.access_token ?? null,
      refreshToken: enc.ciphertext,
      refreshTokenIv: enc.iv,
      refreshTokenTag: enc.tag,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scopes,
    })
    .onConflictDoUpdate({
      target: googleAccounts.userId,
      set: {
        email,
        accessToken: tokens.access_token ?? null,
        refreshToken: enc.ciphertext,
        refreshTokenIv: enc.iv,
        refreshTokenTag: enc.tag,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scopes,
        updatedAt: new Date(),
      },
    });

  return settingsRedirect(req, { google: 'connected' });
}
