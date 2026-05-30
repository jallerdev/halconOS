import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { env } from '~/env';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  if (!env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY no configurada (generar con: openssl rand -hex 32).');
  }
  return Buffer.from(env.ENCRYPTION_KEY, 'hex');
}

export type EncryptedSecret = {
  ciphertext: string;
  iv: string;
  tag: string;
};

export function encryptSecret(plaintext: string): EncryptedSecret {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ct.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function decryptSecret(payload: EncryptedSecret): string {
  const key = getKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  const pt = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return pt.toString('utf8');
}

// Aliases mantenidos por compatibilidad (Google refresh tokens fue el primer caso de uso).
export type EncryptedRefreshToken = EncryptedSecret;
export const encryptRefreshToken = encryptSecret;
export const decryptRefreshToken = decryptSecret;

// CSRF state para el OAuth flow: HMAC-SHA256 sobre { userId, exp } con
// la misma ENCRYPTION_KEY como secreto compartido.
type OAuthStatePayload = { userId: string; exp: number; nonce: string };

function hmac(value: string): string {
  return createHmac('sha256', getKey()).update(value).digest('base64url');
}

export function signOAuthState(userId: string, ttlSeconds = 600): string {
  const payload: OAuthStatePayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    nonce: randomBytes(8).toString('base64url'),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = hmac(body);
  return `${body}.${sig}`;
}

export function verifyOAuthState(state: string): OAuthStatePayload | null {
  const [body, sig] = state.split('.');
  if (!body || !sig) return null;
  const expected = hmac(body);
  if (expected.length !== sig.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as OAuthStatePayload;
    if (!payload.userId || !payload.exp || !payload.nonce) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
