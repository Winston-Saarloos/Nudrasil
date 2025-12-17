"use client";

import { SensorChart } from "./SensorChart";
import useSensorData from "@/hooks/useSensorData";
import { SENSOR_CONFIGS } from "@/config/sensors";
import { ChartPoint, SensorReading } from "@/models/SensorTypes";
import { DateTime } from "luxon";
import { Thermometer, Droplets } from "lucide-react";

interface TemperatureHumidityChartProps {
  className?: string;
  showGrid?: boolean;
  location?: "downstairs" | "upstairs";
  tempSensorId?: number;
  humiditySensorId?: number;
  title?: string;
}

export function TemperatureHumidityChart({
  className,
  showGrid = true,
  location = "downstairs",
  tempSensorId,
  humiditySensorId,
  title,
}: TemperatureHumidityChartProps) {
  // Use provided IDs or default to downstairs sensors
  const tempId =
    tempSensorId ??
    (location === "upstairs"
      ? SENSOR_CONFIGS.temperatureUpstairs.id
      : SENSOR_CONFIGS.temperature.id);
  const humidityId =
    humiditySensorId ??
    (location === "upstairs"
      ? SENSOR_CONFIGS.humidityUpstairs.id
      : SENSOR_CONFIGS.humidity.id);

  const tempQuery = useSensorData(tempId);
  const humidityQuery = useSensorData(humidityId);

  const isLoading = tempQuery.isLoading || humidityQuery.isLoading;
  const error = tempQuery.error || humidityQuery.error;

  const data =
    tempQuery.data && humidityQuery.data
      ? mergeTemperatureHumidityData(tempQuery.data, humidityQuery.data)
      : undefined;

  const lastReading = data && data.length > 0 ? data[data.length - 1] : null;
  const lastTempValue = lastReading?.temp;
  const lastHumidityValue = lastReading?.humidity;

  const displayTitle =
    title ??
    (location === "upstairs"
      ? "Upstairs Temperature & Humidity"
      : "Downstairs Temperature & Humidity");

  return (
    <SensorChart
      title={
        <div className="flex items-center justify-between">
          <span>{displayTitle}</span>
          {(lastTempValue !== undefined || lastHumidityValue !== undefined) && (
            <div className="flex items-center gap-3">
              {lastTempValue !== undefined && (
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-red-500" />
                  <span className="font-semibold text-red-500">
                    {lastTempValue.toFixed(1)}°F
                  </span>
                </div>
              )}
              {lastHumidityValue !== undefined && (
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-blue-500">
                    {lastHumidityValue.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      }
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
      showGrid={showGrid}
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
