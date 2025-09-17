"use client";

import { SensorChart } from "./SensorChart";
import useSensorData from "@/hooks/useSensorData";
import { SENSOR_CONFIGS } from "@/config/sensors";
import { ChartPoint, SensorReading } from "@/models/SensorTypes-temp";
import { DateTime } from "luxon";

interface LightChartProps {
  className?: string;
}

export function LightChart({ className }: LightChartProps) {
  const lightQuery = useSensorData(SENSOR_CONFIGS.light.id);

  const data = lightQuery.data ? mergeLightData(lightQuery.data) : undefined;

  return (
    <SensorChart
      title="Ambient Light Levels"
      description="Light intensity measurements in lux"
      data={data}
      lines={[
        {
          key: "light",
          color: "#FDBF11",
          name: "Light (lux)",
          strokeWidth: 3,
        },
      ]}
      height={300}
      isLoading={lightQuery.isLoading}
      error={lightQuery.error}
      className={className}
    />
  );
}

function mergeLightData(lightData: SensorReading[]): ChartPoint[] {
  const merged: Record<string, ChartPoint> = {};

  const merge = (entry: SensorReading) => {
    const dt = DateTime.fromISO(entry.readingTime, { zone: "utc" })
      .toLocal()
      .startOf("minute");
    const iso = dt.toISO();
    if (!iso) return;

    if (!merged[iso]) {
      merged[iso] = { time: dt.toFormat("hh:mm a"), timestamp: iso };
    }

    merged[iso].light = entry.value === -1 ? 0 : entry.value;
  };

  lightData.forEach((r) => merge(r));

  return Object.values(merged).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}
