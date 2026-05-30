ALTER TABLE "agency_os"."inbound_keys" ADD COLUMN "key_encrypted" text;--> statement-breakpoint
ALTER TABLE "agency_os"."inbound_keys" ADD COLUMN "key_encrypted_iv" text;--> statement-breakpoint
ALTER TABLE "agency_os"."inbound_keys" ADD COLUMN "key_encrypted_tag" text;