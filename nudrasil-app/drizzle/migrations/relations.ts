import { relations } from "drizzle-orm/relations";
import { sensorTypes, sensors, boards, sensorReadings } from "./schema";

export const sensorsRelations = relations(sensors, ({one, many}) => ({
	sensorType: one(sensorTypes, {
		fields: [sensors.typeId],
		references: [sensorTypes.id]
	}),
	board: one(boards, {
		fields: [sensors.boardId],
		references: [boards.id]
	}),
	sensorReadings: many(sensorReadings),
}));

export const sensorTypesRelations = relations(sensorTypes, ({many}) => ({
	sensors: many(sensors),
}));

export const boardsRelations = relations(boards, ({many}) => ({
	sensors: many(sensors),
}));

export const sensorReadingsRelations = relations(sensorReadings, ({one}) => ({
	sensor: one(sensors, {
		fields: [sensorReadings.sensorId],
		references: [sensors.id]
	}),
}));