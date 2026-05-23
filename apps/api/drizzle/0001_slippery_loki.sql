ALTER TABLE "agency_os"."leads" ADD COLUMN "phone_intl" text;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "google_rating" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "review_count" integer;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "has_website" boolean;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "price_level" text;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "business_status" text;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "place_id" text;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "place_types" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "maps_url" text;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "scraped_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "ai_sales_angle" text;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "ai_pain_points" text;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "ai_suggested_page" text;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "ai_generated_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "leads_city_category_idx" ON "agency_os"."leads" USING btree ("city","category");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_owner_place_idx" ON "agency_os"."leads" USING btree ("owner_id","place_id");