CREATE TYPE "agency_os"."user_role" AS ENUM('admin', 'sales');--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD COLUMN "assigned_to_id" uuid;--> statement-breakpoint
ALTER TABLE "agency_os"."users" ADD COLUMN "role" "agency_os"."user_role" DEFAULT 'sales' NOT NULL;--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD CONSTRAINT "leads_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "agency_os"."users"("id") ON DELETE set null ON UPDATE no action;