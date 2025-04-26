"use client";

import { useEffect, useState } from "react";
import { SensorData } from "@/models/sensorData";
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

interface ChartPoint {
  time: string;
  temp?: number;
  humidity?: number;
}

export default function SensorPage() {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/sensor");
        const text = await res.text();
        if (!text) return;

        const json = JSON.parse(text);
        const data = json.data as SensorData[];

        // Sort by time descending, take last 50 entries
        const sorted = [...data].sort((a, b) => a.time - b.time);
        const last50 = sorted.slice(0, 50);

        const grouped: { [timestamp: number]: ChartPoint } = {};

        for (const item of last50) {
          const time = new Date(item.time).toLocaleTimeString();
          if (!grouped[item.time]) {
            grouped[item.time] = { time };
          }
          if (item.sensor === "dht22-temp") {
            // Convert °C to °F
            grouped[item.time].temp = (item.value * 9) / 5 + 32;
          } else if (item.sensor === "dht22-humidity") {
            grouped[item.time].humidity = item.value;
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
            <XAxis dataKey="time" stroke="currentColor" />
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
              {new Date(
                Math.max(
                  new Date(latestTemp.time).getTime(),
                  new Date(latestHumidity.time).getTime(),
                ),
              ).toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Temperature:</span>
              {latestTemp.temp?.toFixed(1)} °F
            </p>
            <p>
              <span className="font-medium">Humidity:</span>
              {latestHumidity.humidity?.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
