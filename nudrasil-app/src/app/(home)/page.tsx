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
  Brush,
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

  return (
    <div className="p-6 space-y-8 bg-white dark:bg-zinc-900 text-black dark:text-white rounded-xl shadow">
      <h1 className="text-2xl font-bold">Sensor Dashboard v2</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Data updates every 10 minutes. Charts refresh every 30 seconds.
      </p>

      <Chart
        title="Ambient Temperature & Humidity"
        data={chartData}
        lines={[
          { key: "temp", color: "#8884d8", name: "Temp (°F)" },
          { key: "humidity", color: "#82ca9d", name: "Humidity (%)" },
        ]}
      />

      <Chart
        title="Soil Moisture Sensors"
        data={chartData}
        lines={[
          { key: "soil1", color: "#ffaa00", name: "Spider Plant 1" },
          { key: "soil2", color: "#ff5588", name: "Spider Plant 2" },
          { key: "soil3", color: "#55aaff", name: "Unknown Plant" },
        ]}
      />

      <Chart
        title="Ambient Lux"
        data={chartData}
        lines={[{ key: "light", color: "#00c0ff", name: "Light (lux)" }]}
      />

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

function Chart({
  title,
  data,
  lines,
}: {
  title: string;
  data: ChartPoint[];
  lines: { key: keyof ChartPoint; color: string; name: string }[];
}) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <ResponsiveContainer>
        <LineChart data={data} syncId="shared">
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis
            dataKey="timestamp"
            stroke="currentColor"
            tickFormatter={(value) =>
              DateTime.fromISO(value).toLocal().toFormat("hh:mm a")
            }
          />
          <YAxis stroke="currentColor" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.key as string}
              type="monotone"
              dataKey={line.key as string}
              stroke={line.color}
              name={line.name}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          ))}
          <Brush
            dataKey="timestamp"
            height={30}
            stroke="#8884d8"
            fill="transparent"
            tickFormatter={(value) =>
              DateTime.fromISO(value).toLocal().toFormat("MM/dd hh:mm")
            }
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
