import { DateTime } from "luxon";
import {
  SensorReading,
  CalibrationData,
  ChartPoint,
  NumericKeys,
} from "@/models/sensorTypes";

/**
 * Calculates moisture percentage from raw value and calibration data
 */
export function calculateMoisturePercent(
  rawValue: number,
  soilMin: number,
  soilMax: number,
): number {
  const clamped = Math.max(Math.min(rawValue, soilMax), soilMin);
  return Math.round(((clamped - soilMin) / (soilMax - soilMin)) * 100);
}

/**
 * Merges sensor readings into chart data points
 */
export function mergeSensorData(
  tempData: SensorReading[],
  humidityData: SensorReading[],
  lightData: SensorReading[],
  soil1Data: SensorReading[],
  soil2Data: SensorReading[],
  soil3Data: SensorReading[],
  cal1Data: CalibrationData,
  cal2Data: CalibrationData,
  cal3Data: CalibrationData,
): ChartPoint[] {
  const merged: Record<string, ChartPoint> = {};

  const merge = (
    entry: SensorReading,
    key: NumericKeys,
    convert?: (v: number) => number,
  ) => {
    const dt = DateTime.fromISO(entry.readingTime, { zone: "utc" })
      .toLocal()
      .startOf("minute");
    const iso = dt.toISO();
    if (!iso) return;

    if (!merged[iso]) {
      merged[iso] = { time: dt.toFormat("hh:mm a"), timestamp: iso };
    }

    merged[iso][key] = convert ? convert(entry.value) : entry.value;
  };

  // Process each sensor type with appropriate conversions
  tempData.forEach(
    (r) => merge(r, "temp", (v) => (v * 9) / 5 + 32), // Convert to Fahrenheit
  );
  humidityData.forEach((r) => merge(r, "humidity"));
  lightData.forEach(
    (r) => merge(r, "light", (v) => (v === -1 ? 0 : v)), // Handle -1 values
  );
  soil1Data.forEach((r) =>
    merge(r, "soil1", (v) =>
      calculateMoisturePercent(v, cal1Data.min, cal1Data.max),
    ),
  );
  soil2Data.forEach((r) =>
    merge(r, "soil2", (v) =>
      calculateMoisturePercent(v, cal2Data.min, cal2Data.max),
    ),
  );
  soil3Data.forEach((r) =>
    merge(r, "soil3", (v) =>
      calculateMoisturePercent(v, cal3Data.min, cal3Data.max),
    ),
  );

  return Object.values(merged).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

