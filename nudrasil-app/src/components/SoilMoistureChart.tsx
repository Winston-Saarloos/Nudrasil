"use client";

import { SensorChart } from "./SensorChart";
import useSensorData from "@/hooks/useSensorData";
import useSensorCalibrationData from "@/hooks/useSensorCalibrationData";
import { SENSOR_CONFIGS } from "@/config/sensors";
import {
  ChartPoint,
  SensorReading,
  CalibrationData,
} from "@/models/SensorTypes";
import { DateTime } from "luxon";

interface SoilMoistureChartProps {
  className?: string;
}

export function SoilMoistureChart({ className }: SoilMoistureChartProps) {
  const soil1Query = useSensorData(SENSOR_CONFIGS.soil1.id);
  const soil2Query = useSensorData(SENSOR_CONFIGS.soil2.id);
  const soil3Query = useSensorData(SENSOR_CONFIGS.soil3.id);
  const cal1Query = useSensorCalibrationData(SENSOR_CONFIGS.soil1.id);
  const cal2Query = useSensorCalibrationData(SENSOR_CONFIGS.soil2.id);
  const cal3Query = useSensorCalibrationData(SENSOR_CONFIGS.soil3.id);

  const isLoading = [
    soil1Query.isLoading,
    soil2Query.isLoading,
    soil3Query.isLoading,
    cal1Query.isLoading,
    cal2Query.isLoading,
    cal3Query.isLoading,
  ].some(Boolean);

  const error = [
    soil1Query.error,
    soil2Query.error,
    soil3Query.error,
    cal1Query.error,
    cal2Query.error,
    cal3Query.error,
  ].find(Boolean) as Error | null;

  const data =
    soil1Query.data &&
    soil2Query.data &&
    soil3Query.data &&
    cal1Query.data &&
    cal2Query.data &&
    cal3Query.data
      ? mergeSoilMoistureData(
          soil1Query.data,
          soil2Query.data,
          soil3Query.data,
          cal1Query.data,
          cal2Query.data,
          cal3Query.data,
        )
      : undefined;

  return (
    <SensorChart
      title="Soil Moisture Sensors"
      description="Moisture levels across different plant containers"
      data={data}
      lines={[
        {
          key: "soil1",
          color: "#17BECF",
          name: "Spider Plant 1",
          strokeWidth: 3,
        },
        {
          key: "soil2",
          color: "#9467BD",
          name: "Spider Plant 2",
          strokeWidth: 3,
        },
        {
          key: "soil3",
          color: "#2ca02c",
          name: "Devil's Ivy",
          strokeWidth: 3,
        },
      ]}
      height={350}
      isLoading={isLoading}
      error={error}
      className={className}
    />
  );
}

function calculateMoisturePercent(
  rawValue: number,
  soilMin: number,
  soilMax: number,
): number {
  const clamped = Math.max(Math.min(rawValue, soilMax), soilMin);
  return Math.round(((clamped - soilMin) / (soilMax - soilMin)) * 100);
}

function mergeSoilMoistureData(
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
    key: "soil1" | "soil2" | "soil3",
    calData: CalibrationData,
  ) => {
    const dt = DateTime.fromISO(entry.readingTime, { zone: "utc" })
      .toLocal()
      .startOf("minute");
    const iso = dt.toISO();
    if (!iso) return;

    if (!merged[iso]) {
      merged[iso] = { time: dt.toFormat("hh:mm a"), timestamp: iso };
    }

    merged[iso][key] = calculateMoisturePercent(
      entry.value,
      calData.min,
      calData.max,
    );
  };

  soil1Data.forEach((r) => merge(r, "soil1", cal1Data));
  soil2Data.forEach((r) => merge(r, "soil2", cal2Data));
  soil3Data.forEach((r) => merge(r, "soil3", cal3Data));

  return Object.values(merged).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}
