"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { DateTime } from "luxon";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "@/lib/utils";

export type ChartType = "line" | "area" | "bar";

export interface ChartLine {
  key: string;
  color: string;
  name: string;
  strokeWidth?: number;
  fill?: string;
}

export interface ChartConfig {
  title: string;
  description?: string;
  type?: ChartType;
  data: any[];
  lines: ChartLine[];
  height?: number;
  showGrid?: boolean;
  showBrush?: boolean;
  showLegend?: boolean;
  className?: string;
  yAxisDomain?: [number, number];
  xAxisTickFormatter?: (value: any) => string;
  yAxisTickFormatter?: (value: any) => string;
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
              <span className="text-zinc-300">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function Chart({
  title,
  description,
  type = "line",
  data,
  lines,
  height = 300,
  showGrid = true,
  showBrush = true,
  showLegend = true,
  className,
  yAxisDomain,
  xAxisTickFormatter = (value) =>
    DateTime.fromISO(value).toLocal().toFormat("hh:mm a"),
  yAxisTickFormatter = (value) => value.toString(),
}: ChartConfig) {
  const renderChart = () => {
    const commonProps = {
      data,
      syncId: "shared",
    };

    const gridProps = showGrid
      ? {
          strokeDasharray: "3 3",
          stroke: "#4b5563", // zinc-600
          opacity: 0.6,
        }
      : {};

    const axisProps = {
      stroke: "#9ca3af", // zinc-400
      fontSize: 12,
      tickLine: false,
      axisLine: false,
    };

    const brushProps = showBrush
      ? {
          dataKey: "timestamp",
          height: 30,
          stroke: "#3b82f6", // blue-500
          fill: "#374151", // gray-700
          tickFormatter: (value: any) =>
            DateTime.fromISO(value).toLocal().toFormat("MM/dd hh:mm"),
        }
      : {};

    switch (type) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid {...gridProps} />}
            <XAxis
              dataKey="timestamp"
              tickFormatter={xAxisTickFormatter}
              {...axisProps}
            />
            <YAxis
              domain={yAxisDomain}
              tickFormatter={yAxisTickFormatter}
              {...axisProps}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {lines.map((line) => (
              <Area
                key={line.key}
                type="monotone"
                dataKey={line.key}
                stroke={line.color}
                fill={line.fill || line.color}
                fillOpacity={0.1}
                name={line.name}
                strokeWidth={line.strokeWidth || 2}
                activeDot={{ r: 6, strokeWidth: 2 }}
                connectNulls
              />
            ))}
            {showBrush && <Brush {...brushProps} />}
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid {...gridProps} />}
            <XAxis
              dataKey="timestamp"
              tickFormatter={xAxisTickFormatter}
              {...axisProps}
            />
            <YAxis
              domain={yAxisDomain}
              tickFormatter={yAxisTickFormatter}
              {...axisProps}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {lines.map((line) => (
              <Bar
                key={line.key}
                dataKey={line.key}
                fill={line.color}
                name={line.name}
                radius={[4, 4, 0, 0]}
              />
            ))}
            {showBrush && <Brush {...brushProps} />}
          </BarChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid {...gridProps} />}
            <XAxis
              dataKey="timestamp"
              tickFormatter={xAxisTickFormatter}
              {...axisProps}
            />
            <YAxis
              domain={yAxisDomain}
              tickFormatter={yAxisTickFormatter}
              {...axisProps}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                stroke={line.color}
                name={line.name}
                strokeWidth={line.strokeWidth || 2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2 }}
                connectNulls
              />
            ))}
            {showBrush && <Brush {...brushProps} />}
          </LineChart>
        );
    }
  };

  return (
    <Card
      className={cn("overflow-hidden bg-zinc-800 border-zinc-700", className)}
    >
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-white">
          {title}
        </CardTitle>
        {description && <p className="text-sm text-zinc-300">{description}</p>}
      </CardHeader>
      <CardContent className="pt-0">
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
