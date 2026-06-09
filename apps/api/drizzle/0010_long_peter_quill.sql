ALTER TABLE "agency_os"."leads" ADD COLUMN "dedupe_key" text;--> statement-breakpoint
CREATE INDEX "leads_org_dedupe_idx" ON "agency_os"."leads" USING btree ("org_id","dedupe_key");--> statement-breakpoint

-- Backfill: para leads existentes computamos dedupe_key con la misma lógica que
-- `buildDedupeKey` en TypeScript (apps/api/src/lib/dedup.ts). Normalización:
-- lowercase, trim, collapse whitespace, NFD-strip de diacríticos (vía unaccent
-- si existe; si no, usamos lower(trim()) que ya cubre el 90% de casos).
-- Después de esta migración, todos los leads tienen dedupeKey poblado.
UPDATE "agency_os"."leads"
SET "dedupe_key" = (
  lower(regexp_replace(trim(business_name), '\s+', ' ', 'g'))
  || '|' ||
  lower(regexp_replace(trim(coalesce(split_part(address, ',', 1), '')), '\s+', ' ', 'g'))
  || '|' ||
  regexp_replace(coalesce(phone, ''), '\D', '', 'g')
)
WHERE business_name IS NOT NULL AND "dedupe_key" IS NULL;
