import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { googleConfigured } from '~/env';
import { signOAuthState } from '~/server/google/crypto';
import { GOOGLE_SCOPES, getOAuthClient } from '~/server/google/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!googleConfigured) {
    return NextResponse.json(
      { error: 'Integración con Google no configurada.' },
      { status: 503 },
    );
  }
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  const state = signOAuthState(userId);
  const oauth = getOAuthClient();
  const url = oauth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_SCOPES,
    state,
  });
  return NextResponse.redirect(url);
}
