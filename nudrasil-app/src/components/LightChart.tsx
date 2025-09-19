"use client";

import { SensorChart } from "./SensorChart";
import useSensorData from "@/hooks/useSensorData";
import { SENSOR_CONFIGS } from "@/config/sensors";
import { ChartPoint, SensorReading } from "@/models/SensorTypes";
import { DateTime } from "luxon";
import { Sun, Moon } from "lucide-react";

interface LightChartProps {
  className?: string;
  showGrid?: boolean;
}

export function LightChart({ className, showGrid = true }: LightChartProps) {
  const lightQuery = useSensorData(SENSOR_CONFIGS.light.id);

  const data = lightQuery.data ? mergeLightData(lightQuery.data) : undefined;

  const lastReading = data && data.length > 0 ? data[data.length - 1] : null;
  const lastLightValue = lastReading?.light;

  const isDaytime = lastLightValue !== undefined && lastLightValue > 50;
  const LightIcon = isDaytime ? Sun : Moon;
  const iconColor = isDaytime ? "text-yellow-500" : "text-slate-500";

  return (
    <SensorChart
      title={
        <div className="flex items-center justify-between">
          <span>Ambient Light Levels</span>
          {lastLightValue !== undefined && (
            <div className="flex items-center gap-2">
              <LightIcon className={`h-4 w-4 ${iconColor}`} />
              <span className={`font-semibold ${iconColor}`}>
                {lastLightValue.toFixed(0)} lux
              </span>
            </div>
          )}
        </div>
      }
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
      showGrid={showGrid}
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
