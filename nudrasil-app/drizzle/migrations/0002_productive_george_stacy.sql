-- ALTER TABLE ONLY if this table wasn't already created
-- CREATE TABLE "device_configs" (
-- 	"id" serial PRIMARY KEY NOT NULL,
-- 	"device_id" text NOT NULL,
-- 	"config" jsonb NOT NULL,
-- 	"created_at" timestamp DEFAULT now(),
-- 	"updated_at" timestamp DEFAULT now(),
-- 	CONSTRAINT "device_configs_device_id_unique" UNIQUE("device_id")
-- );
-- --> statement-breakpoint

ALTER TABLE "boards" ADD COLUMN "last_known_ip" "inet";