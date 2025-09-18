import { DateTime } from "luxon";
import { SensorReading } from "@/models/SensorTypes";

const INTERVAL_MINUTES = 10;

/**
 * Fills in missing readings by interpolating between existing data points
 * Assumes readings should be collected every 10 minutes
 *
 * To optimize the data saved in the database we don't want to store values unless they have changed. This function fills in the gaps.
 */
export function fillMissingReadings(
  data: SensorReading[],
  intervalMinutes: number = INTERVAL_MINUTES,
): SensorReading[] {
  if (!data || data.length === 0) {
    return [];
  }

  for (const reading of data) {
    if (typeof reading.value !== "number" || !reading.readingTime) {
      throw new Error(
        `Invalid sensor reading: missing 'value' or 'readingTime' field`,
      );
    }
  }

  const sortedData = [...data].sort(
    (a, b) =>
      DateTime.fromISO(a.readingTime).toMillis() -
      DateTime.fromISO(b.readingTime).toMillis(),
  );

  const filledData: SensorReading[] = [];
  const intervalMs = intervalMinutes * 60 * 1000;

  for (let i = 0; i < sortedData.length - 1; i++) {
    const current = sortedData[i];
    const next = sortedData[i + 1];

    const currentTime = DateTime.fromISO(current.readingTime).toMillis();
    const nextTime = DateTime.fromISO(next.readingTime).toMillis();
    const timeDiff = nextTime - currentTime;

    filledData.push(current);

    // fill gaps between current and next reading
    if (timeDiff > intervalMs) {
      const steps = Math.floor(timeDiff / intervalMs);

      for (let step = 1; step < steps; step++) {
        const interpolatedTime = currentTime + step * intervalMs;
        const progress = (step * intervalMs) / timeDiff;

        const interpolatedValue =
          current.value + (next.value - current.value) * progress;

        filledData.push({
          value: interpolatedValue,
          readingTime: DateTime.fromMillis(interpolatedTime).toISO()!,
        });
      }
    }
  }

  filledData.push(sortedData[sortedData.length - 1]);

  return filledData;
}

export function aggregateSensorData(
  data: SensorReading[],
  aggregateBy: "hour" | "day",
): SensorReading[] {
  if (!data || data.length === 0) {
    return [];
  }

  for (const reading of data) {
    if (typeof reading.value !== "number" || !reading.readingTime) {
      throw new Error(
        "Invalid sensor reading: missing value or readingTime field",
      );
    }
  }

  const groups = new Map<string, SensorReading[]>();

  for (const reading of data) {
    const dt = DateTime.fromISO(reading.readingTime);
    let key: string;

    if (aggregateBy === "hour") {
      // Group by hour (YYYY-MM-DD HH:00:00)
      key = dt.startOf("hour").toISO()!;
    } else {
      // Group by day (YYYY-MM-DD 00:00:00)
      key = dt.startOf("day").toISO()!;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(reading);
  }

  const aggregatedData: SensorReading[] = [];

  for (const [timeKey, readings] of groups) {
    if (readings.length === 0) continue;

    const avgValue =
      readings.reduce((sum, reading) => sum + reading.value, 0) /
      readings.length;

    // Use the start of the time period as the timestamp
    const aggregatedTime = timeKey;

    aggregatedData.push({
      value: avgValue,
      readingTime: aggregatedTime,
    });
  }

  return aggregatedData.sort(
    (a, b) =>
      DateTime.fromISO(a.readingTime).toMillis() -
      DateTime.fromISO(b.readingTime).toMillis(),
  );
}

/**
 * aggregates sensor data by intervals
 */
export function aggregateSensorDataByInterval(
  data: SensorReading[],
  intervalHours: number,
): SensorReading[] {
  if (!data || data.length === 0) {
    return [];
  }

  for (const reading of data) {
    if (typeof reading.value !== "number" || !reading.readingTime) {
      throw new Error(
        "Invalid sensor reading: missing value or readingTime field",
      );
    }
  }

  const sortedData = [...data].sort(
    (a, b) =>
      DateTime.fromISO(a.readingTime).toMillis() -
      DateTime.fromISO(b.readingTime).toMillis(),
  );

  const aggregatedData: SensorReading[] = [];
  const intervalMs = intervalHours * 60 * 60 * 1000;

  // Find the start time (beginning of the first day)
  const startTime = DateTime.fromISO(sortedData[0].readingTime)
    .startOf("day")
    .toMillis();

  const groups = new Map<number, SensorReading[]>();

  for (const reading of sortedData) {
    const readingTime = DateTime.fromISO(reading.readingTime).toMillis();
    const intervalStart =
      startTime +
      Math.floor((readingTime - startTime) / intervalMs) * intervalMs;

    if (!groups.has(intervalStart)) {
      groups.set(intervalStart, []);
    }
    groups.get(intervalStart)!.push(reading);
  }

  // aggregate each group
  for (const [intervalStart, readings] of groups) {
    if (readings.length === 0) continue;

    const avgValue =
      readings.reduce((sum, reading) => sum + reading.value, 0) /
      readings.length;

    aggregatedData.push({
      value: avgValue,
      readingTime: DateTime.fromMillis(intervalStart).toISO()!,
    });
  }

  return aggregatedData.sort(
    (a, b) =>
      DateTime.fromISO(a.readingTime).toMillis() -
      DateTime.fromISO(b.readingTime).toMillis(),
  );
}

export type TimePeriod = "1day" | "3days" | "7days";

export interface TimePeriodConfig {
  label: string;
  days: number;
  aggregation: "hour" | "6hour" | "day";
}

export const TIME_PERIOD_CONFIGS: Record<TimePeriod, TimePeriodConfig> = {
  "1day": {
    label: "1 Day",
    days: 1,
    aggregation: "hour",
  },
  "3days": {
    label: "3 Days",
    days: 3,
    aggregation: "6hour",
  },
  "7days": {
    label: "7 Days",
    days: 7,
    aggregation: "day",
  },
};

/**
 * filters sensor data to only include the specified number of days
 */
export function filterDataByDays(
  data: SensorReading[],
  days: number,
): SensorReading[] {
  if (!data || data.length === 0) return [];

  const sortedData = [...data].sort(
    (a, b) =>
      DateTime.fromISO(a.readingTime).toMillis() -
      DateTime.fromISO(b.readingTime).toMillis(),
  );

  const mostRecentTime = DateTime.fromISO(
    sortedData[sortedData.length - 1].readingTime,
  );
  const cutoffTime = mostRecentTime.minus({ days });

  // filter data to only include readings from the last N days
  return sortedData.filter((reading) => {
    const readingTime = DateTime.fromISO(reading.readingTime);
    return readingTime >= cutoffTime;
  });
}

/**
 * processes sensor data based on the selected time period
 */
export function processSensorDataForTimePeriod(
  data: SensorReading[],
  timePeriod: TimePeriod,
): SensorReading[] {
  const config = TIME_PERIOD_CONFIGS[timePeriod];

  const filteredData = filterDataByDays(data, config.days);

  const filledData = fillMissingReadings(filteredData);

  switch (config.aggregation) {
    case "hour":
      return aggregateSensorData(filledData, "hour");
    case "6hour":
      return aggregateSensorDataByInterval(filledData, 6);
    case "day":
      return aggregateSensorData(filledData, "day");
    default:
      return filledData;
  }
}
