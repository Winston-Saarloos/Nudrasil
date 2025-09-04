import { ReferenceLine } from "recharts";
import { DateTime } from "luxon";

interface DayBoundaryIndicatorProps {
  data: any[];
}

export function DayBoundaryIndicator({ data }: DayBoundaryIndicatorProps) {
  if (!data || data.length === 0) return null;

  const dayBoundaries: { timestamp: string; label: string }[] = [];
  let currentDay = "";

  data.forEach((point, index) => {
    if (!point.timestamp) return;

    const dt = DateTime.fromISO(point.timestamp);
    const dayKey = dt.toFormat("yyyy-MM-dd");

    if (dayKey !== currentDay && index > 0) {
      currentDay = dayKey;
      dayBoundaries.push({
        timestamp: point.timestamp,
        label: dt.toFormat("MMM dd"),
      });
    } else if (index === 0) {
      currentDay = dayKey;
    }
  });

  return (
    <>
      {dayBoundaries.map((boundary, index) => (
        <ReferenceLine
          key={`day-${index}`}
          x={boundary.timestamp}
          stroke="#6b7280"
          //strokeDasharray="5 5"
          strokeWidth={2}
          opacity={0.8}
          label={{
            value: boundary.label,
            position: "insideTop",
            fill: "#9ca3af",
            fontSize: 12,
            fontWeight: "bold",
            offset: -16,
          }}
        />
      ))}
    </>
  );
}
