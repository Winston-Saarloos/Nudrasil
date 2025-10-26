"use client";

import { Clock, AlertTriangle } from "lucide-react";
import { DateTime } from "luxon";
import useSensorData from "@/hooks/useSensorData";
import { SENSOR_CONFIGS } from "@/config/sensors";

export function LastReadingIndicator() {
  const sensorData = useSensorData(SENSOR_CONFIGS.soil1.id);

  if (sensorData.isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-400`}>
        <Clock className="h-4 w-4 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  if (sensorData.error || !sensorData.data || sensorData.data.length === 0) {
    return (
      <div className={`flex items-center gap-2 text-sm text-red-400`}>
        <AlertTriangle className="h-4 w-4" />
        <span>{sensorData.error?.message || "No data available"}</span>
      </div>
    );
  }

  const latestReading = sensorData.data[0];
  const readingTime = DateTime.fromISO(latestReading.readingTime);
  const now = DateTime.now();
  const timeDiff = now.diff(readingTime, "minutes").minutes;

  let statusIcon: React.ReactNode | null = null;

  if (timeDiff <= 15) {
    statusIcon = null;
  } else if (timeDiff <= 30) {
    statusIcon = <Clock className="h-4 w-4 text-yellow-500" />;
  } else {
    statusIcon = <AlertTriangle className="h-4 w-4 text-red-500" />;
  }

  const formatTimeAgo = (minutes: number) => {
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${Math.round(minutes)}m ago`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);

    if (hours < 24) {
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m ago`
        : `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (remainingHours > 0) {
      return `${days}d ${remainingHours}h ago`;
    }

    return `${days}d ago`;
  };

  const timeAgoText = formatTimeAgo(timeDiff);
  const lastReadingTime = readingTime.toFormat("h:mm a");

  return (
    <div className={`flex items-center gap-2 text-sm`}>
      {statusIcon}

      <div>
        <span className="text-xs text-gray-500">
          Last reading: {timeAgoText} ({lastReadingTime})
        </span>
      </div>
    </div>
  );
}
