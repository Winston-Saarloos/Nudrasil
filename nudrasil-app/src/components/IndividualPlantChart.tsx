"use client";

import { DateTime } from "luxon";
import { Droplets } from "lucide-react";

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

  return (
    <SensorChart
      title={
        <div className="flex items-center justify-between">
          <span>{sensorConfig.name}</span>
          {lastMoistureValue !== undefined && (
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <span className="font-semibold text-blue-500 dark:text-blue-400">
                {lastMoistureValue}%
              </span>
            </div>
          )}
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
