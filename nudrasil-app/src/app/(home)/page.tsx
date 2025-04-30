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
} from "recharts";
//import { Button } from "@/components/ui/button";

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
    const fetchData = async () => {
      try {
        const res = await fetch("/api/sensor");
        const json = await res.json();
        const data = json.data as {
          sensorId: number;
          value: number;
          readingTime: string;
        }[];

        // Group by readingTime string
        const grouped: Record<string, ChartPoint> = {};

        for (const item of data) {
          const date = new Date(item.readingTime);

          // Round to the start of the minute
          date.setSeconds(0);
          date.setMilliseconds(0);
          const key = date.toLocaleString();

          const formatted = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          if (!grouped[key]) {
            grouped[key] = {
              time: formatted,
              timestamp: key,
            };
          }

          if (item.sensorId === 1) {
            grouped[key].temp = (item.value * 9) / 5 + 32;
          } else if (item.sensorId === 2) {
            grouped[key].humidity = item.value;
          }
        }

        const finalChartData = Object.values(grouped)
          .sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
          )
          .slice(-50);

        setChartData(finalChartData);
      } catch (error) {
        console.error("Failed to fetch sensor data:", error);
      }
    };

    fetchData();
    // Optional: enable live updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const latestTemp = [...chartData]
    .reverse()
    .find((data) => data.temp !== undefined);

  const latestHumidity = [...chartData]
    .reverse()
    .find((data) => data.humidity !== undefined);

  return (
    <div className="p-6 space-y-4 bg-white dark:bg-zinc-900 text-black dark:text-white rounded-xl shadow">
      <h1 className="text-2xl font-bold">Sensor Dashboard</h1>
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
        A large work in progress..
      </h2>
      <hr className="border-gray-300 dark:border-gray-700" />
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Data is sent once a minute
      </p>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis
              dataKey="timestamp"
              stroke="currentColor"
              tickFormatter={(value) =>
                new Date(value).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
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
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tooltip-bg, #1f2937)",
                borderColor: "#444",
                color: "white",
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temp"
              stroke="#8884d8"
              name="Temp (°F)"
              dot={{ r: 3 }}
              connectNulls
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="humidity"
              stroke="#82ca9d"
              name="Humidity (%)"
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* <Button variant="outline" onClick={() => location.reload()}>
        Refresh Page
      </Button> */}
      {chartData.length > 0 && latestTemp && latestHumidity && (
        <div className="mt-4 p-4 rounded-md bg-zinc-100 dark:bg-zinc-800">
          <h3 className="text-md font-semibold mb-2 text-zinc-700 dark:text-zinc-200">
            Latest Reading
          </h3>
          <div className="text-sm space-y-1 text-zinc-800 dark:text-zinc-100">
            <p>
              <span className="font-medium">Time (most recent):</span>
              {new Date(latestTemp.timestamp).toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Temperature: </span>
              {latestTemp.temp?.toFixed(1)} °F
            </p>
            <p>
              <span className="font-medium">Humidity: </span>
              {latestHumidity.humidity?.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
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
