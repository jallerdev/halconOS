import { TRPCError } from '@trpc/server';

type Bucket = number[]; // timestamps (ms)
const store = new Map<string, Bucket>();

/**
 * Rate limiter de ventana deslizante, en memoria.
 * Suficiente como primera capa; en producción multi-instancia conviene Redis (Upstash).
 */
export function rateLimit(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  const bucket = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (bucket.length >= max) {
    const retryMs = windowMs - (now - bucket[0]!);
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Demasiadas solicitudes. Intenta de nuevo en ${Math.ceil(retryMs / 1000)}s.`,
    });
  }
  bucket.push(now);
  store.set(key, bucket);

  // Limpieza oportunista para no crecer sin límite.
  if (store.size > 5000) {
    for (const [k, v] of store) {
      const fresh = v.filter((t) => now - t < windowMs);
      if (fresh.length === 0) store.delete(k);
      else store.set(k, fresh);
    }
  }
}
