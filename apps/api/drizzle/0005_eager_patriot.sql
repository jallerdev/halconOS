CREATE TABLE "agency_os"."inbound_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agency_os"."inbound_keys" ADD CONSTRAINT "inbound_keys_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "agency_os"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "inbound_keys_hash_idx" ON "agency_os"."inbound_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "inbound_keys_org_idx" ON "agency_os"."inbound_keys" USING btree ("org_id");