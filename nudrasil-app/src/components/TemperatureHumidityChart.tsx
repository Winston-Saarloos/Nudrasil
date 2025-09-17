"use client";

import { SensorChart } from "./SensorChart";
import useSensorData from "@/hooks/useSensorData";
import { SENSOR_CONFIGS } from "@/config/sensors";
import { ChartPoint, SensorReading } from "@/models/SensorTypes-temp";
import { DateTime } from "luxon";

interface TemperatureHumidityChartProps {
  className?: string;
}

export function TemperatureHumidityChart({
  className,
}: TemperatureHumidityChartProps) {
  const tempQuery = useSensorData(SENSOR_CONFIGS.temperature.id);
  const humidityQuery = useSensorData(SENSOR_CONFIGS.humidity.id);

  const isLoading = tempQuery.isLoading || humidityQuery.isLoading;
  const error = tempQuery.error || humidityQuery.error;

  const data =
    tempQuery.data && humidityQuery.data
      ? mergeTemperatureHumidityData(tempQuery.data, humidityQuery.data)
      : undefined;

  return (
    <SensorChart
      title="Ambient Temperature & Humidity"
      description="Real-time monitoring of environmental conditions"
      data={data}
      lines={[
        {
          key: "temp",
          color: "#D62728",
          name: "Temperature (°F)",
          strokeWidth: 3,
        },
        {
          key: "humidity",
          color: "#1696D2",
          name: "Humidity (%)",
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

function mergeTemperatureHumidityData(
  tempData: SensorReading[],
  humidityData: SensorReading[],
): ChartPoint[] {
  const merged: Record<string, ChartPoint> = {};

  const merge = (
    entry: SensorReading,
    key: "temp" | "humidity",
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

  // Process temperature data (convert to Fahrenheit)
  tempData.forEach((r) => merge(r, "temp", (v) => (v * 9) / 5 + 32));

  // Process humidity data
  humidityData.forEach((r) => merge(r, "humidity"));

  return Object.values(merged).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}
