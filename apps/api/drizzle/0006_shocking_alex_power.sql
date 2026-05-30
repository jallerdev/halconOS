CREATE TYPE "agency_os"."task_kind" AS ENUM('task', 'meeting');--> statement-breakpoint
CREATE TABLE "agency_os"."google_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"access_token" text,
	"refresh_token" text NOT NULL,
	"refresh_token_iv" text NOT NULL,
	"refresh_token_tag" text NOT NULL,
	"expires_at" timestamp with time zone,
	"scopes" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "google_accounts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "agency_os"."tasks" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agency_os"."tasks" ADD COLUMN "kind" "agency_os"."task_kind" DEFAULT 'task' NOT NULL;--> statement-breakpoint
ALTER TABLE "agency_os"."tasks" ADD COLUMN "lead_id" uuid;--> statement-breakpoint
ALTER TABLE "agency_os"."tasks" ADD COLUMN "starts_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agency_os"."tasks" ADD COLUMN "ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agency_os"."tasks" ADD COLUMN "attendees" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "agency_os"."tasks" ADD COLUMN "meet_url" text;--> statement-breakpoint
ALTER TABLE "agency_os"."tasks" ADD COLUMN "google_event_id" text;--> statement-breakpoint
ALTER TABLE "agency_os"."tasks" ADD COLUMN "google_calendar_id" text;--> statement-breakpoint
ALTER TABLE "agency_os"."google_accounts" ADD CONSTRAINT "google_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "agency_os"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_os"."tasks" ADD CONSTRAINT "tasks_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "agency_os"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_lead_kind_starts_idx" ON "agency_os"."tasks" USING btree ("lead_id","kind","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_google_event_idx" ON "agency_os"."tasks" USING btree ("google_event_id");