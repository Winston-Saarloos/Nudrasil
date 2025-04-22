ALTER TABLE "boards" DROP CONSTRAINT "boards_identifier_key";--> statement-breakpoint
ALTER TABLE "sensor_types" DROP CONSTRAINT "sensor_types_name_key";--> statement-breakpoint
ALTER TABLE "sensors" DROP CONSTRAINT "sensors_type_id_fkey";
--> statement-breakpoint
ALTER TABLE "sensors" DROP CONSTRAINT "sensors_board_id_fkey";
--> statement-breakpoint
ALTER TABLE "sensor_readings" DROP CONSTRAINT "sensor_readings_sensor_id_fkey";
--> statement-breakpoint
DROP INDEX "idx_sensor_readings_time";--> statement-breakpoint
ALTER TABLE "sensor_readings" ALTER COLUMN "reading_time" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_type_id_sensor_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."sensor_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_sensor_id_sensors_id_fk" FOREIGN KEY ("sensor_id") REFERENCES "public"."sensors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sensor_readings_time" ON "sensor_readings" USING btree ("reading_time");--> statement-breakpoint
ALTER TABLE "sensor_types" ADD CONSTRAINT "sensor_types_name_unique" UNIQUE("name");