"use client";

import { DateTime } from "luxon";
import { Droplets, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

import { SensorChart } from "@components/SensorChart";
import useSensorData from "@hooks/useSensorData";
import useSensorCalibrationData from "@hooks/useSensorCalibrationData";
import { SensorConfig } from "@/config/sensors";
import {
  ChartPoint,
  SensorReading,
  CalibrationData,
} from "@/models/SensorTypes";
import { calculateMoisturePercent } from "@/utils/sensorUtils";
import { TimePeriod } from "@/utils/sensorDataUtils";
import { getPlantZonesForType } from "@/config/plantZones";

interface IndividualPlantChartProps {
  sensorConfig: SensorConfig;
  className?: string;
  selectedTimePeriod?: TimePeriod;
  showGrid?: boolean;
}

export function IndividualPlantChart({
  sensorConfig,
  className,
  selectedTimePeriod = "1day",
  showGrid = true,
}: IndividualPlantChartProps) {
  const sensorData = useSensorData(sensorConfig.id);
  const sensorCalibrationData = useSensorCalibrationData(sensorConfig.id);

  const isLoading = sensorData.isLoading || sensorCalibrationData.isLoading;
  const error = sensorData.error || sensorCalibrationData.error;

  const chartData =
    sensorData.data && sensorCalibrationData.data
      ? processSoilMoistureData(sensorData.data, sensorCalibrationData.data)
      : undefined;

  const lastReading =
    chartData && chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const lastMoistureValue = lastReading?.moisture;

  const plantZones = getPlantZonesForType(sensorConfig.plantType);

  const getZoneForValue = (
    value: number | undefined,
    zones: typeof plantZones,
  ): "green" | "yellow" | "red" | null => {
    if (value === undefined || !zones) return null;

    if (zones.green.range) {
      const [min, max] = zones.green.range;
      if (value >= min && value <= max) return "green";
    }

    if (zones.yellow.range_low) {
      const [min, max] = zones.yellow.range_low;
      if (value >= min && value <= max) return "yellow";
    }
    if (zones.yellow.range_high) {
      const [min, max] = zones.yellow.range_high;
      if (value >= min && value <= max) return "yellow";
    }

    if (zones.red.range_low) {
      const [min, max] = zones.red.range_low;
      if (value >= min && value <= max) return "red";
    }
    if (zones.red.range_high) {
      const [min, max] = zones.red.range_high;
      if (value >= min && value <= max) return "red";
    }

    return null;
  };

  const currentZone = getZoneForValue(lastMoistureValue, plantZones);

  const getZoneIcon = (zone: typeof currentZone) => {
    switch (zone) {
      case "green":
        return {
          Icon: CheckCircle2,
          color: "text-green-400",
        };
      case "yellow":
        return {
          Icon: AlertTriangle,
          color: "text-yellow-400",
        };
      case "red":
        return {
          Icon: XCircle,
          color: "text-red-400",
        };
      default:
        return {
          Icon: CheckCircle2,
          color: "text-gray-400",
        };
    }
  };

  const zoneIcon = getZoneIcon(currentZone);

  return (
    <SensorChart
      title={
        <div className="flex items-center justify-between">
          <span>{sensorConfig.name}</span>
          <div className="flex items-center gap-2">
            {lastMoistureValue !== undefined && (
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <span className="font-semibold text-blue-500 dark:text-blue-400">
                  {lastMoistureValue}%
                </span>
              </div>
            )}
            {plantZones && lastMoistureValue !== undefined && currentZone && (
              <div className="mt-1">
                {(() => {
                  const IconComponent = zoneIcon.Icon;
                  return (
                    <IconComponent
                      className={`h-4 w-4 transition-colors ${zoneIcon.color}`}
                    />
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      }
      description={`Soil moisture: ${sensorConfig.unit}`}
      rawSensorData={sensorData.data}
      calibrationData={sensorCalibrationData.data}
      selectedTimePeriod={selectedTimePeriod}
      lines={[
        {
          key: "moisture",
          color: sensorConfig.color,
          name: "Moisture %",
          strokeWidth: 3,
        },
      ]}
      height={250}
      showLegend={false}
      yAxisDomain={[0, 100]}
      isLoading={isLoading}
      error={error}
      className={className}
      showGrid={showGrid}
      zones={plantZones || undefined}
    />
  );
}

function processSoilMoistureData(
  sensorData: SensorReading[],
  calData: CalibrationData,
): ChartPoint[] {
  return sensorData
    .map((entry) => {
      const dt = DateTime.fromISO(entry.readingTime, { zone: "utc" })
        .toLocal()
        .startOf("minute");

      return {
        time: dt.toFormat("hh:mm a"),
        timestamp: dt.toISO() || entry.readingTime,
        moisture: calculateMoisturePercent(
          entry.value,
          calData.min,
          calData.max,
        ),
      };
    })
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
}
