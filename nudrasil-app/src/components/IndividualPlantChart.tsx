"use client";

import { useState } from "react";
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
  const [showTooltip, setShowTooltip] = useState(false);
  const [isIconHovered, setIsIconHovered] = useState(false);
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

  const getTooltipContent = (
    zone: typeof currentZone,
    zones: typeof plantZones,
  ): string | null => {
    if (!zone || !zones) return null;

    switch (zone) {
      case "green":
        return zones.green.description;
      case "yellow":
        return zones.yellow.description;
      case "red":
        return zones.red.description;
      default:
        return null;
    }
  };

  const zoneIcon = getZoneIcon(currentZone);
  const tooltipContent = getTooltipContent(currentZone, plantZones);

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
              <div className="relative mt-1">
                <button
                  type="button"
                  className="relative"
                  onMouseEnter={() => {
                    setShowTooltip(true);
                    setIsIconHovered(true);
                  }}
                  onMouseLeave={() => {
                    setShowTooltip(false);
                    setIsIconHovered(false);
                  }}
                  onFocus={() => {
                    setShowTooltip(true);
                    setIsIconHovered(true);
                  }}
                  onBlur={() => {
                    setShowTooltip(false);
                    setIsIconHovered(false);
                  }}
                  aria-label={`Current moisture: ${lastMoistureValue.toFixed(1)}%`}
                >
                  {(() => {
                    const IconComponent = zoneIcon.Icon;
                    return (
                      <IconComponent
                        className={`h-4 w-4 transition-colors ${zoneIcon.color}`}
                      />
                    );
                  })()}
                </button>
                {showTooltip && tooltipContent && (
                  <div
                    className="absolute right-0 top-6 z-50 w-96 max-w-[calc(100vw-2rem)] px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg shadow-lg text-xs text-white"
                    role="tooltip"
                    onMouseEnter={() => {
                      setShowTooltip(true);
                      setIsIconHovered(true);
                    }}
                    onMouseLeave={() => {
                      setShowTooltip(false);
                      setIsIconHovered(false);
                    }}
                  >
                    <span className={zoneIcon.color}>{tooltipContent}</span>
                  </div>
                )}
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
      externalHoverState={isIconHovered}
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
