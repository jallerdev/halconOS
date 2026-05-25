import { createHash } from 'node:crypto';

import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { inboundKeys, leads, notes } from '~/server/db/schema';
import { rateLimit } from '~/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lead entrante desde una landing pública. El cliente NUNCA envía orgId/ownerId:
// el scope (organización + dueño) lo determina la API key del lado del servidor.
// Cada org tiene su propia key, así sus leads caen en SU organización y nunca en otra.
const inboundSchema = z.object({
  name: z.string().trim().min(1).max(200),
  businessName: z.string().trim().max(200).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional(),
  service: z.string().trim().max(80).optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  note: z.string().trim().max(2000).optional(),
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || 'unknown';
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function POST(req: Request) {
  // 1. API key obligatoria en el header.
  const provided = req.headers.get('x-api-key');
  if (!provided) {
    return json({ ok: false, error: 'No autorizado.' }, 401);
  }

  // 2. Rate limit por IP (antes de tocar la DB).
  try {
    rateLimit(`inbound:${clientIp(req)}`, 10, 60_000);
  } catch {
    return json({ ok: false, error: 'Demasiadas solicitudes. Intenta más tarde.' }, 429);
  }

  // 3. Resolver la key: buscar por hash, activa (no revocada). De aquí salen org y owner.
  const key = await db.query.inboundKeys.findFirst({
    where: and(eq(inboundKeys.keyHash, sha256(provided)), isNull(inboundKeys.revokedAt)),
  });
  if (!key) {
    return json({ ok: false, error: 'No autorizado.' }, 401);
  }

  // 4. Validación del cuerpo (sin campo orgId — es imposible elegir org desde fuera).
  let parsed;
  try {
    parsed = inboundSchema.parse(await req.json());
  } catch (e) {
    return json(
      {
        ok: false,
        error: 'Datos inválidos.',
        issues: e instanceof z.ZodError ? e.flatten() : undefined,
      },
      400,
    );
  }

  const email = parsed.email?.trim() || null;

  // 5. Insertar el lead con el scope de la key.
  const [created] = await db
    .insert(leads)
    .values({
      orgId: key.orgId,
      ownerId: key.ownerId,
      businessName: parsed.businessName?.trim() || parsed.name,
      contactName: parsed.name,
      phone: parsed.phone?.trim() || null,
      email,
      source: 'landing',
      status: 'NEW',
      tags: parsed.service ? [parsed.service] : [],
      nextFollowUpAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
    })
    .returning({ id: leads.id });

  if (!created) {
    return json({ ok: false, error: 'No se pudo crear el lead.' }, 500);
  }

  // 6. Nota opcional con el mensaje del formulario (aparece en el timeline del lead).
  if (parsed.note) {
    await db.insert(notes).values({
      orgId: key.orgId,
      ownerId: key.ownerId,
      parentType: 'lead',
      parentId: created.id,
      body: parsed.note,
    });
  }

  // 7. Marcar uso de la key (best-effort).
  await db
    .update(inboundKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(inboundKeys.id, key.id));

  return json({ ok: true, id: created.id }, 201);
}
