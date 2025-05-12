"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { DateTime } from "luxon";

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<string, string>) => {
  if (active && payload && payload.length) {
    const localTime = DateTime.fromISO(label)
      .toLocal()
      .toFormat("MM/dd hh:mm a");

    return (
      <div className="bg-zinc-800 text-white p-3 rounded shadow text-sm">
        <p className="font-semibold">{localTime}</p>
        {payload.map((entry, index) => (
          <p key={index}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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

interface ChartPoint {
  time: string;
  timestamp: string;
  temp?: number;
  humidity?: number;
  soil?: number;
  light?: number;
}

function calculateLightPercent(rawValue: number): number {
  const dark = 20000; // very dark = high value
  const bright = 200; // very bright = low value

  const clamped = Math.max(Math.min(rawValue, dark), bright);
  const percent = ((dark - clamped) / (dark - bright)) * 100;
  return Math.round(percent);
}

function calculateMoisturePercent(rawValue: number): number {
  const dry = 12000;
  const wet = 4000;
  const clamped = Math.max(Math.min(rawValue, dry), wet);
  const percent = ((dry - clamped) / (dry - wet)) * 100;
  return Math.round(percent);
}

function moistureDescription(percent: number): string {
  if (percent >= 75) return "Wet";
  if (percent >= 40) return "Moist";
  return "Dry";
}

function moistureColor(percent: number): string {
  if (percent >= 75) return "text-green-600";
  if (percent >= 40) return "text-yellow-600";
  return "text-red-600";
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
        const [tempRes, humidityRes, soilRes, lightRes] = await Promise.all([
          fetch("/api/sensor?sensorId=1"),
          fetch("/api/sensor?sensorId=2"),
          fetch("/api/sensor?sensorId=3"),
          fetch("/api/sensor?sensorId=4"),
        ]);

        const tempJson: { data: SensorReading[] } = await tempRes.json();
        const humidityJson: { data: SensorReading[] } =
          await humidityRes.json();
        const soilJson: { data: SensorReading[] } = await soilRes.json();
        const lightJson: { data: SensorReading[] } = await lightRes.json();

        const merged: Record<string, ChartPoint> = {};

        const mergeReading = (
          entry: SensorReading,
          key: "temp" | "humidity" | "soil" | "light",
        ) => {
          const dt = DateTime.fromISO(entry.readingTime, { zone: "utc" })
            .toLocal()
            .startOf("minute");
          const iso = dt.toISO();
          if (!iso) return;

          if (!merged[iso]) {
            merged[iso] = {
              time: dt.toFormat("hh:mm a"),
              timestamp: iso,
            };
          }

          if (key === "temp") {
            merged[iso].temp = (entry.value * 9) / 5 + 32;
          } else if (key === "humidity") {
            merged[iso].humidity = entry.value;
          } else if (key === "soil") {
            merged[iso].soil = calculateMoisturePercent(entry.value);
          } else if (key === "light") {
            merged[iso].light = calculateLightPercent(entry.value);
          }
        };

        tempJson.data.forEach((r) => mergeReading(r, "temp"));
        humidityJson.data.forEach((r) => mergeReading(r, "humidity"));
        soilJson.data.forEach((r) => mergeReading(r, "soil"));
        lightJson.data.forEach((r) => mergeReading(r, "light"));

        const sorted = Object.values(merged)
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          )
          .slice(-50);

        setChartData(sorted);
      } catch (err) {
        console.error("Failed to fetch sensor data:", err);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 30000);
    return () => clearInterval(interval);
  }, []);

  const latestTemp = [...chartData]
    .reverse()
    .find((data) => data.temp !== undefined);
  const latestHumidity = [...chartData]
    .reverse()
    .find((data) => data.humidity !== undefined);
  const latestSoil = [...chartData]
    .reverse()
    .find((data) => data.soil !== undefined);
  const latestLight = [...chartData]
    .reverse()
    .find((data) => data.light !== undefined);

  return (
    <div className="p-6 space-y-4 bg-white dark:bg-zinc-900 text-black dark:text-white rounded-xl shadow">
      <h1 className="text-2xl font-bold">Sensor Dashboard</h1>
      <h3>{"sensor data + charts = <3"}</h3>
      <hr className="border-gray-300 dark:border-gray-700" />
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Data is sent once every 10 minutes
      </p>

      {/* Temp/Humidity Chart */}
      <div style={{ width: "100%", height: 300 }}>
        <h2 className="text-1xl font-bold mb-4">
          Ambient Temperature & Humidity
        </h2>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis
              dataKey="timestamp"
              stroke="currentColor"
              tickFormatter={(value) =>
                DateTime.fromISO(value).toLocal().toFormat("hh:mm a")
              }
            />
            <YAxis
              yAxisId="left"
              stroke="currentColor"
              label={{
                value: "°F / %",
                angle: -90,
                position: "insideLeft",
                fill: "currentColor",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temp"
              stroke="#8884d8"
              name="Temp (°F)"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="humidity"
              stroke="#82ca9d"
              name="Humidity (%)"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Soil Moisture Chart */}
      <div style={{ width: "100%", height: 300 }}>
        <h2 className="text-1xl font-bold mb-4 mt-8">
          Spider Plant 1 - Soil Moisture %
        </h2>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis
              dataKey="timestamp"
              stroke="currentColor"
              tickFormatter={(value) =>
                DateTime.fromISO(value).toLocal().toFormat("hh:mm a")
              }
            />
            <YAxis
              stroke="currentColor"
              label={{
                value: "Soil Moisture (%)",
                angle: -90,
                position: "insideLeft",
                fill: "currentColor",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="soil"
              stroke="#ffaa00"
              name="Soil Moisture (%)"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="light"
              stroke="#00c0ff"
              name="Light (%)"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Latest Readings Summary */}
      {(latestTemp || latestHumidity || latestSoil) && (
        <div className="mt-16 p-4 rounded-md bg-zinc-100 dark:bg-zinc-800">
          <h3 className="text-md font-semibold mb-2 text-zinc-700 dark:text-zinc-200">
            Latest Readings
          </h3>
          <div className="text-sm space-y-1 text-zinc-800 dark:text-zinc-100">
            {latestTemp && (
              <p>
                <span className="font-medium">Temperature:</span>{" "}
                {latestTemp.temp?.toFixed(1)} °F
              </p>
            )}
            {latestHumidity && (
              <p>
                <span className="font-medium">Humidity:</span>{" "}
                {latestHumidity.humidity?.toFixed(1)}%
              </p>
            )}
            {latestSoil && (
              <p>
                <span className="font-medium">Soil Moisture:</span>{" "}
                <span className={moistureColor(latestSoil.soil!)}>
                  {latestSoil.soil}% – {moistureDescription(latestSoil.soil!)}
                </span>
              </p>
            )}
            {latestLight && (
              <p>
                <span className="font-medium">Light Level:</span>{" "}
                {latestLight.light}%
              </p>
            )}
          </div>
        </div>
      )}

      {/* Board Status */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">Board Status</h2>
        <ul className="space-y-2">
          {statusList.map((board) => (
            <li
              key={board.id}
              className={`p-2 rounded border ${
                board.status === "healthy"
                  ? "border-green-500"
                  : "border-red-500"
              }`}
            >
              <strong>{board.name}</strong>: {board.status}
              {board.latencyMs !== null && ` (${board.latencyMs} ms)`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
