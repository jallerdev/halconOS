CREATE SCHEMA "agency_os";
--> statement-breakpoint
CREATE TYPE "agency_os"."lead_status" AS ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST');--> statement-breakpoint
CREATE TYPE "agency_os"."note_parent_type" AS ENUM('lead', 'project');--> statement-breakpoint
CREATE TYPE "agency_os"."project_status" AS ENUM('PLANNING', 'IN_PROGRESS', 'REVIEW', 'DELIVERED', 'ON_HOLD', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "agency_os"."task_priority" AS ENUM('LOW', 'MED', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "agency_os"."task_status" AS ENUM('TODO', 'DOING', 'DONE');--> statement-breakpoint
CREATE TABLE "agency_os"."leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"business_name" text NOT NULL,
	"contact_name" text,
	"phone" text,
	"email" text,
	"source" text,
	"estimated_value" numeric(12, 2),
	"status" "agency_os"."lead_status" DEFAULT 'NEW' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"next_follow_up_at" timestamp with time zone,
	"last_contacted_at" timestamp with time zone,
	"project_id" uuid,
	"converted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_os"."notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"parent_type" "agency_os"."note_parent_type" NOT NULL,
	"parent_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_os"."projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"amount" numeric(12, 2) NOT NULL,
	"status" "agency_os"."project_status" DEFAULT 'PLANNING' NOT NULL,
	"start_date" timestamp with time zone,
	"deadline" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_os"."tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "agency_os"."task_status" DEFAULT 'TODO' NOT NULL,
	"priority" "agency_os"."task_priority" DEFAULT 'MED' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_os"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
ALTER TABLE "agency_os"."leads" ADD CONSTRAINT "leads_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "agency_os"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_os"."notes" ADD CONSTRAINT "notes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "agency_os"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_os"."projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "agency_os"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_os"."projects" ADD CONSTRAINT "projects_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "agency_os"."leads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_os"."tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "agency_os"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leads_owner_status_idx" ON "agency_os"."leads" USING btree ("owner_id","status");--> statement-breakpoint
CREATE INDEX "leads_follow_up_idx" ON "agency_os"."leads" USING btree ("next_follow_up_at");--> statement-breakpoint
CREATE INDEX "notes_parent_idx" ON "agency_os"."notes" USING btree ("parent_type","parent_id");--> statement-breakpoint
CREATE INDEX "projects_owner_status_idx" ON "agency_os"."projects" USING btree ("owner_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_lead_unique_idx" ON "agency_os"."projects" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "tasks_project_status_pos_idx" ON "agency_os"."tasks" USING btree ("project_id","status","position");