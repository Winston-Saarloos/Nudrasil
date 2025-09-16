"use client";

import { useEffect, useState } from "react";
import { TemperatureHumidityChart } from "@/components/TemperatureHumidityChart";
import { SoilMoistureChart } from "@/components/SoilMoistureChart";
import { LightChart } from "@/components/LightChart";
import { StatusList } from "@/components/ui/status-indicator";

interface BoardStatus {
  id: number;
  name: string;
  status: "healthy" | "unreachable" | "invalid-response";
  latencyMs: number | null;
}

export default function SensorPage() {
  const [statusList, setStatusList] = useState<BoardStatus[]>([]);

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
      <h1 className="text-2xl mb-2 font-bold">Sensor Dashboard</h1>
      <p className="text-sm text-gray-400">
        Data updates every 10 minutes. Charts refresh every 30 seconds.
      </p>

      <TemperatureHumidityChart />
      <SoilMoistureChart />
      <LightChart />

      {/* Board Status */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">Board Status</h2>
        <StatusList items={statusItems} />
      </div>
    </div>
  );
}
