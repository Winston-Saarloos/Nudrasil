"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { SensorChart } from "@/components/sensorChart";
import { StatusList } from "@/components/ui/status-indicator";

interface SensorReading {
  value: number;
  readingTime: string;
}

interface BoardStatus {
  id: number;
  name: string;
  status: "healthy" | "unreachable" | "invalid-response";
  latencyMs: number | null;
}

interface CalibrationData {
  min: number;
  max: number;
}

interface ChartPoint {
  timestamp: string;
  time: string;
  temp?: number;
  humidity?: number;
  light?: number;
  soil1?: number;
  soil2?: number;
  soil3?: number;
}

type NumericKeys = Exclude<
  {
    [K in keyof ChartPoint]: ChartPoint[K] extends number | undefined
      ? K
      : never;
  }[keyof ChartPoint],
  undefined
>;

function calculateMoisturePercent(
  rawValue: number,
  soilMin: number,
  soilMax: number,
): number {
  const clamped = Math.max(Math.min(rawValue, soilMax), soilMin);
  const percent = ((soilMax - clamped) / (soilMax - soilMin)) * 100;
  return Math.round(percent);
}

export default function SensorPage() {
  const [statusList, setStatusList] = useState<BoardStatus[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    const fetchStatus = async () => {
      const res = await fetch("/api/boards/status");
      const json = await res.json();
      setStatusList(json.data);
    };

    fetchStatus();
  }, []);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const [
          tempRes,
          humidityRes,
          lightRes,
          soil1Res,
          soil2Res,
          soil3Res,
          cal1Res,
          cal2Res,
          cal3Res,
        ] = await Promise.all([
          fetch("/api/sensor?sensorId=1"),
          fetch("/api/sensor?sensorId=2"),
          fetch("/api/sensor?sensorId=4"),
          fetch("/api/sensor?sensorId=3"),
          fetch("/api/sensor?sensorId=9"),
          fetch("/api/sensor?sensorId=10"),
          fetch("/api/sensor/calibration?sensorId=3"),
          fetch("/api/sensor/calibration?sensorId=9"),
          fetch("/api/sensor/calibration?sensorId=10"),
        ]);

        const [
          tempJson,
          humidityJson,
          lightJson,
          soil1Json,
          soil2Json,
          soil3Json,
        ] = await Promise.all([
          tempRes.json(),
          humidityRes.json(),
          lightRes.json(),
          soil1Res.json(),
          soil2Res.json(),
          soil3Res.json(),
        ]);

        const [cal1, cal2, cal3]: CalibrationData[] = await Promise.all([
          cal1Res.json().then((r) => r.data),
          cal2Res.json().then((r) => r.data),
          cal3Res.json().then((r) => r.data),
        ]);

        const merged: Record<string, ChartPoint> = {};

        const merge = (
          entry: SensorReading,
          key: NumericKeys,
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

        tempJson.data.forEach((r: SensorReading) =>
          merge(r, "temp", (v) => (v * 9) / 5 + 32),
        );
        humidityJson.data.forEach((r: SensorReading) => merge(r, "humidity"));
        lightJson.data.forEach((r: SensorReading) => merge(r, "light"));
        soil1Json.data.forEach((r: SensorReading) =>
          merge(r, "soil1", (v) =>
            calculateMoisturePercent(v, cal1.min, cal1.max),
          ),
        );
        soil2Json.data.forEach((r: SensorReading) =>
          merge(r, "soil2", (v) =>
            calculateMoisturePercent(v, cal2.min, cal2.max),
          ),
        );
        soil3Json.data.forEach((r: SensorReading) =>
          merge(r, "soil3", (v) =>
            calculateMoisturePercent(v, cal3.min, cal3.max),
          ),
        );

        setChartData(
          Object.values(merged).sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          ),
        );
      } catch (err) {
        console.error("Failed to fetch sensor data:", err);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusItems = statusList.map((board) => ({
    status: board.status,
    label: board.name,
    description: `Board ID: ${board.id}`,
    latencyMs: board.latencyMs,
  }));

  return (
    <div className="p-6 space-y-8 bg-zinc-900 text-white rounded-xl shadow">
      <h1 className="text-2xl font-bold">Sensor Dashboard v2</h1>
      <p className="text-sm text-gray-400">
        Data updates every 10 minutes. Charts refresh every 30 seconds.
      </p>

      <SensorChart
        title="Ambient Temperature & Humidity"
        description="Real-time monitoring of environmental conditions"
        data={chartData}
        lines={[
          {
            key: "temp",
            color: "#3b82f6",
            name: "Temperature (°F)",
            strokeWidth: 3,
          },
          {
            key: "humidity",
            color: "#10b981",
            name: "Humidity (%)",
            strokeWidth: 3,
          },
        ]}
        height={350}
      />

      <SensorChart
        title="Soil Moisture Sensors"
        description="Moisture levels across different plant containers"
        data={chartData}
        lines={[
          {
            key: "soil1",
            color: "#f59e0b",
            name: "Spider Plant 1",
            strokeWidth: 3,
          },
          {
            key: "soil2",
            color: "#ef4444",
            name: "Spider Plant 2",
            strokeWidth: 3,
          },
          {
            key: "soil3",
            color: "#8b5cf6",
            name: "Unknown Plant",
            strokeWidth: 3,
          },
        ]}
        height={350}
      />

      <SensorChart
        title="Ambient Light Levels"
        description="Light intensity measurements in lux"
        data={chartData}
        lines={[
          {
            key: "light",
            color: "#06b6d4",
            name: "Light (lux)",
            strokeWidth: 3,
          },
        ]}
        height={300}
      />

      {/* Board Status */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">Board Status</h2>
        <StatusList items={statusItems} />
      </div>
    </div>
  );
}
