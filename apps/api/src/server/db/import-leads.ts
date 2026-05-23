import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';
import { leads, users } from './schema';

type Row = Record<string, string>;

// --- Helpers para el formato numérico colombiano ("4,5" -> 4.5, "2.357" -> 2357) ---
function parseDecimal(v: string | undefined): string | null {
  if (!v) return null;
  const cleaned = v.trim().replace(/\./g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? String(n) : null;
}

function parseLatLng(v: string | undefined): string | null {
  if (!v) return null;
  const cleaned = v.trim().replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? String(n) : null;
}

function parseIntSafe(v: string | undefined): number | null {
  if (!v) return null;
  const cleaned = v.trim().replace(/\./g, '');
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : null;
}

function mapStatus(estadoLead: string | undefined): 'NEW' | 'LOST' {
  return (estadoLead ?? '').trim().toLowerCase() === 'descartado' ? 'LOST' : 'NEW';
}

function mapsUrlFromPlaceId(placeId: string | undefined): string | null {
  const id = (placeId ?? '').trim();
  return id ? `https://www.google.com/maps/place/?q=place_id:${id}` : null;
}

function clean(v: string | undefined): string | null {
  const t = (v ?? '').trim();
  return t.length ? t : null;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('Usage: tsx import-leads.ts <path-to-csv>');
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL required.');
    process.exit(1);
  }

  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client, { schema, casing: 'snake_case' });

  // Owner: usuario admin de dev (mismo externalId que usa el bypass de tRPC).
  const devKey = process.env.DEV_BYPASS_USER_ID || 'local';
  const externalId = `dev:${devKey}`;
  let owner = await db.query.users.findFirst({ where: eq(users.externalId, externalId) });
  if (!owner) {
    const [created] = await db
      .insert(users)
      .values({ email: `${devKey}@dev.local`, name: 'Admin', externalId, role: 'admin' })
      .returning();
    owner = created;
  } else if (owner.role !== 'admin') {
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, owner.id));
  }
  if (!owner) throw new Error('No owner');
  console.log('Owner:', owner.email, owner.id);

  // El CSV tiene 2 filas de título antes del header real.
  const raw = readFileSync(csvPath, 'utf-8');
  const allRows: string[][] = parse(raw, { relax_column_count: true, skip_empty_lines: false });
  const headerIdx = allRows.findIndex((r) => r[0]?.trim() === 'Nombre');
  if (headerIdx === -1) throw new Error('No se encontró la fila de header (columna "Nombre")');
  const header = allRows[headerIdx]!.map((h) => h.trim());

  const records: Row[] = allRows
    .slice(headerIdx + 1)
    .filter((r) => r.some((c) => c?.trim()))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])) as Row);

  console.log('Filas de datos:', records.length);

  const values = records
    .filter((r) => clean(r['Nombre']))
    .map((r) => ({
      ownerId: owner!.id,
      businessName: r['Nombre']!.trim(),
      phone: clean(r['Teléfono']),
      phoneIntl: clean(r['Teléfono internacional']),
      source: 'google_maps',
      status: mapStatus(r['Estado lead']),
      category: clean(r['Sector']),
      city: clean(r['Ciudad']),
      address: clean(r['Dirección']),
      googleRating: parseDecimal(r['Calificación']),
      reviewCount: parseIntSafe(r['Nº reseñas']),
      hasWebsite: (r['¿Tiene web?'] ?? '').trim().toLowerCase() === 'sí',
      websiteUrl: clean(r['Sitio web']),
      priceLevel: clean(r['Nivel de precio']),
      businessStatus: clean(r['Estado negocio']),
      placeId: clean(r['Place ID']),
      placeTypes: clean(r['Tipos'])
        ? r['Tipos']!.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      mapsUrl: mapsUrlFromPlaceId(r['Place ID']),
      latitude: parseLatLng(r['Latitud']),
      longitude: parseLatLng(r['Longitud']),
      tags: clean(r['Categoría']) ? [r['Categoría']!.trim()] : [],
    }));

  console.log('Insertando', values.length, 'leads…');

  let inserted = 0;
  const BATCH = 200;
  for (let i = 0; i < values.length; i += BATCH) {
    const chunk = values.slice(i, i + BATCH);
    const res = await db
      .insert(leads)
      .values(chunk)
      .onConflictDoNothing({ target: [leads.ownerId, leads.placeId] })
      .returning({ id: leads.id });
    inserted += res.length;
    process.stdout.write(`  ${Math.min(i + BATCH, values.length)}/${values.length}\r`);
  }

  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .where(eq(leads.ownerId, owner.id));

  console.log(`\nInsertados nuevos: ${inserted}. Total leads del owner: ${countRows[0]?.count ?? 0}`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
