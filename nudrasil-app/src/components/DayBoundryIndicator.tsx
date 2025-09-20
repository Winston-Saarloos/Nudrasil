import { ReferenceLine } from "recharts";
import { DateTime } from "luxon";
import { useBreakpointDown } from "@hooks/useBreakpoint";

interface DayBoundaryIndicatorProps {
  data: any[];
}

export function DayBoundaryIndicator({ data }: DayBoundaryIndicatorProps) {
  const isTabletOrMobile = useBreakpointDown("lg");

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
      {dayBoundaries.map((boundary, index) => {
        const isEven = index % 2 === 0;
        let label;

        if (!isTabletOrMobile || isEven) {
          label = {
            value: boundary.label,
            position: "insideTop" as const,
            fill: "#9ca3af",
            fontSize: 12,
            fontWeight: "bold",
            offset: -16,
          };
        }
        return (
          <ReferenceLine
            key={`day-${index}`}
            x={boundary.timestamp}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeDasharray="5 5"
            strokeWidth={2}
            opacity={0.8}
            label={label}
          />
        );
      })}
    </>
  );
}
