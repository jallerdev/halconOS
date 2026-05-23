import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { env } from '~/env';
import { appRouter } from '~/server/routers/_app';
import { createContext } from '~/server/trpc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Allowlist de orígenes. En dev se permite localhost / IP LAN / app Expo.
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  const configured = env.ALLOWED_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (configured.includes(origin)) return true;
  if (env.NODE_ENV !== 'production') {
    // localhost, 127.0.0.1, IPs LAN (192.168.x / 10.x), y el esquema de Expo.
    return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
      origin,
    );
  }
  return false;
}

function corsHeaders(origin: string | null): Record<string, string> {
  if (!isAllowedOrigin(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin!,
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client, x-trpc-source',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

const handler = async (req: Request) => {
  const res = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: (opts) => createContext(opts),
    onError({ error, path }) {
      if (env.NODE_ENV !== 'production') {
        console.error(`[tRPC] ${path ?? '<no-path>'}:`, error.message);
      }
    },
  });
  const headers = corsHeaders(req.headers.get('origin'));
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  return res;
};

export { handler as GET, handler as POST };
