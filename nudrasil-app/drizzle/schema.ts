import {
  pgTable,
  serial,
  uuid,
  text,
  timestamp,
  doublePrecision,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// --- Boards Table ---
export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  identifier: uuid("identifier").defaultRandom().notNull(),
  name: text("name").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// --- Sensor Types Table ---
export const sensorTypes = pgTable("sensor_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

// --- Sensors Table ---
export const sensors = pgTable("sensors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  typeId: integer("type_id")
    .notNull()
    .references(() => sensorTypes.id, { onDelete: "restrict" }),
  location: text("location").notNull(),
  boardId: integer("board_id").references(() => boards.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

// --- Sensor Readings Table ---
export const sensorReadings = pgTable(
  "sensor_readings",
  {
    id: serial("id").primaryKey(),
    sensorId: integer("sensor_id")
      .notNull()
      .references(() => sensors.id, { onDelete: "cascade" }),
    value: doublePrecision("value").notNull(),
    readingTime: timestamp("reading_time", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      readingTimeIndex: index("idx_sensor_readings_time").on(table.readingTime),
    };
  },
);

// -- Config Table --
export const device_configs = pgTable("device_configs", {
  id: serial("id").primaryKey(),
  device_id: text("device_id").unique().notNull(),
  config: jsonb("config").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
