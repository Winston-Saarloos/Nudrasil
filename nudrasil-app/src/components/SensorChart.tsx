"use client";
import { ReactNode, useMemo } from "react";
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
import { DateTime } from "luxon";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { cn } from "@/lib/utils";
import { DayBoundaryIndicator } from "@components/DayBoundryIndicator";
import {
  ChartPoint,
  SensorReading,
  CalibrationData,
} from "@models/SensorTypes";
import {
  TimePeriod,
  processSensorDataForTimePeriod,
} from "@/utils/sensorDataUtils";
import { calculateMoisturePercent } from "@/utils/sensorUtils";
import { useBreakpointDown } from "@/hooks/useBreakpoint";

export interface ChartLine {
  key: string;
  color: string;
  name: string;
  strokeWidth?: number;
  fill?: string;
}

interface SensorChartProps {
  title: string | ReactNode;
  description?: string;
  data?: ChartPoint[];
  rawSensorData?: SensorReading[];
  calibrationData?: CalibrationData;
  lines: ChartLine[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
  yAxisDomain?: [number, number];
  isLoading?: boolean;
  error?: Error | null;
  selectedTimePeriod?: TimePeriod;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const localTime = DateTime.fromISO(label || "")
      .toLocal()
      .toFormat("MMM dd, hh:mm a");

    return (
      <div className="bg-zinc-800 border border-zinc-600 text-white p-4 rounded-lg shadow-lg text-sm">
        <p className="font-semibold text-zinc-200 mb-2">{localTime}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.name}:</span>
              <span className="text-zinc-300">
                {typeof entry.value === "number"
                  ? entry.value.toFixed(1)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

function calculateXAxisInterval(dataLength: number, isMobile: boolean): number {
  if (dataLength <= 0) return 0;

  const targetLabels = isMobile ? 3 : 6;

  if (dataLength <= targetLabels) {
    return 0;
  }

  const interval = Math.max(1, Math.floor(dataLength / targetLabels));

  return isMobile ? Math.max(interval, 2) : interval;
}

export function SensorChart({
  title,
  description,
  data,
  rawSensorData,
  calibrationData,
  lines,
  height = 300,
  showGrid = true,
  showLegend = true,
  className,
  yAxisDomain,
  isLoading = false,
  error = null,
  selectedTimePeriod = "1day",
}: SensorChartProps) {
  const isMobile = useBreakpointDown("md");

  const processedData = useMemo(() => {
    if (rawSensorData && rawSensorData.length > 0) {
      try {
        const processedSensorData = processSensorDataForTimePeriod(
          rawSensorData,
          selectedTimePeriod,
        );

        return processedSensorData.map((sensorReading) => {
          const chartPoint: ChartPoint = {
            timestamp: sensorReading.readingTime,
            time: sensorReading.readingTime,
          };

          if (calibrationData && lines[0]?.key === "moisture") {
            const moistureValue = calculateMoisturePercent(
              sensorReading.value,
              calibrationData.min,
              calibrationData.max,
            );
            return { ...chartPoint, moisture: moistureValue };
          } else {
            const key = lines[0]?.key || "value";
            return { ...chartPoint, [key]: sensorReading.value };
          }
        });
      } catch (error) {
        console.error("Error processing sensor data:", error);
        return [];
      }
    }
    return data || [];
  }, [rawSensorData, selectedTimePeriod, data, lines, calibrationData]);

  const chartData = processedData;

  const xAxisInterval = useMemo(() => {
    return calculateXAxisInterval(chartData.length, isMobile);
  }, [chartData.length, isMobile]);

  const responsiveMargin = useMemo(() => {
    const baseMargin = { top: 25, right: 20, left: 20, bottom: 0 };
    if (isMobile) {
      return { ...baseMargin, bottom: 20 };
    }
    return baseMargin;
  }, [isMobile]);

  const gridProps = {
    strokeDasharray: "3 3",
    stroke: "#374151", // gray-700
    strokeOpacity: 0.3,
  };

  const xAxisTickFormatter = (value: string | number) => {
    const dt = DateTime.fromISO(value as string);

    if (!dt.isValid) {
      return String(value);
    }

    const localTime = dt.toLocal();

    return localTime.toFormat(isMobile ? "HH:mm" : "h:mm a");
  };

  const yAxisTickFormatter = (value: string | number) => String(value);

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-lg">Loading sensor data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-lg text-red-400">
              Error loading sensor data: {error.message}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-lg text-gray-400">No data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={responsiveMargin}>
            {showGrid && <CartesianGrid {...gridProps} />}
            <XAxis
              dataKey="timestamp"
              tickFormatter={xAxisTickFormatter}
              stroke="#6b7280"
              fontSize={isMobile ? 10 : 12}
              tick={{
                dy: 4,
                textAnchor: "middle",
                fontSize: isMobile ? 10 : 12,
              }}
              tickLine={{ stroke: "#6b7280" }}
              interval={xAxisInterval}
              minTickGap={isMobile ? 20 : 10}
              textAnchor={isMobile ? "end" : "middle"}
            />
            <YAxis
              domain={yAxisDomain}
              tickFormatter={yAxisTickFormatter}
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                  fontSize: "14px",
                }}
              />
            )}
            <DayBoundaryIndicator data={chartData} />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                stroke={line.color}
                strokeWidth={line.strokeWidth || 2}
                fill={line.fill}
                dot={false}
                activeDot={{ r: 4, stroke: line.color, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
