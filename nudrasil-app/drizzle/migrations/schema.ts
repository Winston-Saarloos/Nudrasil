import { pgTable, unique, serial, uuid, text, timestamp, foreignKey, integer, index, doublePrecision } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const boards = pgTable("boards", {
	id: serial().primaryKey().notNull(),
	identifier: uuid().defaultRandom().notNull(),
	name: text().notNull(),
	location: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("boards_identifier_key").on(table.identifier),
]);

export const sensorTypes = pgTable("sensor_types", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("sensor_types_name_key").on(table.name),
]);

export const sensors = pgTable("sensors", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	typeId: integer("type_id").notNull(),
	location: text().notNull(),
	boardId: integer("board_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.typeId],
			foreignColumns: [sensorTypes.id],
			name: "sensors_type_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.boardId],
			foreignColumns: [boards.id],
			name: "sensors_board_id_fkey"
		}).onDelete("set null"),
]);

export const sensorReadings = pgTable("sensor_readings", {
	id: serial().primaryKey().notNull(),
	sensorId: integer("sensor_id").notNull(),
	value: doublePrecision().notNull(),
	readingTime: timestamp("reading_time", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_sensor_readings_time").using("btree", table.readingTime.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.sensorId],
			foreignColumns: [sensors.id],
			name: "sensor_readings_sensor_id_fkey"
		}).onDelete("cascade"),
]);
