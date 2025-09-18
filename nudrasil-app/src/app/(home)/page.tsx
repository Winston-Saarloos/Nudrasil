"use client";

import { useEffect, useState } from "react";
import { TemperatureHumidityChart } from "@/components/TemperatureHumidityChart";
import { IndividualPlantChart } from "@/components/IndividualPlantChart";
import { LightChart } from "@/components/LightChart";
import { SENSOR_CONFIGS } from "@/config/sensors";
import { StatusList } from "@/components/ui/status-indicator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { TimePeriod, TIME_PERIOD_CONFIGS } from "@/utils/sensorDataUtils";

interface BoardStatus {
  id: number;
  name: string;
  status: "healthy" | "unreachable" | "invalid-response";
  latencyMs: number | null;
}

export default function SensorPage() {
  const [statusList, setStatusList] = useState<BoardStatus[]>([]);
  const [selectedTimePeriod, setSelectedTimePeriod] =
    useState<TimePeriod>("3days");

  useEffect(() => {
    const fetchStatus = async () => {
      const res = await fetch("/api/boards/status");
      const json = await res.json();
      setStatusList(json.data);
    };

    fetchStatus();
  }, []);

  const statusItems = statusList.map((board) => ({
    status: board.status,
    label: board.name,
    description: `Board ID: ${board.id}`,
    latencyMs: board.latencyMs,
  }));

  return (
    <div className="p-6 space-y-8 text-white rounded-xl shadow">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Plant Soil Moisture</h2>
            <p className="text-sm text-gray-400">
              Data updates every 10 minutes. Charts refresh every 30 seconds.
            </p>
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

      {/* Board Status */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">Board Status</h2>
        <StatusList items={statusItems} />
      </div>
    </div>
  );
}
