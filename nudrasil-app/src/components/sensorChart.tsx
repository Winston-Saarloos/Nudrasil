import { ChartConfig, Chart } from "@/components/ui/chart";

export function SensorChart({
  title,
  description,
  data,
  lines,
  height = 300,
  className,
}: Omit<ChartConfig, "type" | "showGrid" | "showBrush" | "showLegend">) {
  return (
    <Chart
      title={title}
      description={description}
      type="line"
      data={data}
      lines={lines}
      height={height}
      showGrid={true}
      showBrush={true}
      showLegend={true}
      className={className}
    />
  );
}
