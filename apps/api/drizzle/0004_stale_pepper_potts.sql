DROP INDEX "agency_os"."leads_owner_status_idx";--> statement-breakpoint
DROP INDEX "agency_os"."leads_owner_place_idx";--> statement-breakpoint
DROP INDEX "agency_os"."projects_owner_status_idx";--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "org_id" text;--> statement-breakpoint
ALTER TABLE "agency_os"."notes" ADD COLUMN "org_id" text;--> statement-breakpoint
ALTER TABLE "agency_os"."projects" ADD COLUMN "org_id" text;--> statement-breakpoint
ALTER TABLE "agency_os"."tasks" ADD COLUMN "org_id" text;--> statement-breakpoint
CREATE INDEX "leads_org_status_idx" ON "agency_os"."leads" USING btree ("org_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_org_place_idx" ON "agency_os"."leads" USING btree ("org_id","place_id");--> statement-breakpoint
CREATE INDEX "projects_org_status_idx" ON "agency_os"."projects" USING btree ("org_id","status");