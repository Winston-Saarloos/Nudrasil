"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import { BoardStatusList } from "@components/BoardStatusList";
import { LastReadingIndicator } from "@components/LastReadingIndicator";
import { SENSOR_CONFIGS } from "@/config/sensors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { TimePeriod, TIME_PERIOD_CONFIGS } from "@/utils/sensorDataUtils";
import { ChartSkeleton } from "@/components/ChartSkeleton";

const TemperatureHumidityChart = dynamic(
  () =>
    import("@components/TemperatureHumidityChart").then(
      (module) => module.TemperatureHumidityChart,
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={350} />,
  },
);

const IndividualPlantChart = dynamic(
  () =>
    import("@/components/IndividualPlantChart").then(
      (module) => module.IndividualPlantChart,
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={250} />,
  },
);

const LightChart = dynamic(
  () => import("@/components/LightChart").then((module) => module.LightChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={300} />,
  },
);

export default function SensorPage() {
  const [selectedTimePeriod, setSelectedTimePeriod] =
    useState<TimePeriod>("3days");

  return (
    <div className="p-6 space-y-8 text-white rounded-xl shadow">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Soil Moisture</h2>
            <p className="text-sm text-gray-400">
              Data updates every 10 minutes. Charts refresh every 30 seconds.
            </p>
            <LastReadingIndicator />
          </div>
          <Select
            value={selectedTimePeriod}
            onValueChange={(value: TimePeriod) => setSelectedTimePeriod(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIME_PERIOD_CONFIGS).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <IndividualPlantChart
            sensorConfig={SENSOR_CONFIGS.soil1}
            selectedTimePeriod={selectedTimePeriod}
            showGrid={false}
          />
          <IndividualPlantChart
            sensorConfig={SENSOR_CONFIGS.soil2}
            selectedTimePeriod={selectedTimePeriod}
            showGrid={false}
          />
          <IndividualPlantChart
            sensorConfig={SENSOR_CONFIGS.soil3}
            selectedTimePeriod={selectedTimePeriod}
            showGrid={false}
          />
        </div>
      </div>

      <TemperatureHumidityChart showGrid={false} />

      <LightChart showGrid={false} />

      <BoardStatusList />
    </div>
  );
}
