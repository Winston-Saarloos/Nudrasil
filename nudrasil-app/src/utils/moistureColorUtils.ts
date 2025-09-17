import { PLANT_MOISTURE_CONFIGS } from "@/config/plantMoistureConfigs";

export interface MoistureLevel {
  color: string;
  bgColor: string;
  status: "healthy" | "caution" | "problem";
  description: string;
}

export interface PlantMoistureConfig {
  healthy: { min: number; max: number };
  caution: { min: number; max: number }[];
  problem: { min: number; max: number }[];
}

// Color coded moisture levels
const COLOR_WHITE = "#ffffff";
const COLOR_GREEN = "#22c55e";
const COLOR_AMBER = "#f59e0b";
const COLOR_RED = "#ef4444";

const MOISTURE_COLORS = {
  healthy: {
    color: COLOR_WHITE,
    bgColor: COLOR_GREEN,
    status: "healthy" as const,
    description: "Healthy moisture level",
  },
  caution: {
    color: COLOR_WHITE,
    bgColor: COLOR_AMBER,
    status: "caution" as const,
    description: "Caution - monitor closely",
  },
  problem: {
    color: COLOR_WHITE,
    bgColor: COLOR_RED,
    status: "problem" as const,
    description: "Problem - immediate attention needed",
  },
};

/**
 * Determines the moisture level status and color for a given plant and moisture percentage
 */
export function getMoistureLevel(
  plantName: string,
  moisturePercent: number,
): MoistureLevel {
  const config = PLANT_MOISTURE_CONFIGS[plantName];

  if (!config) {
    return {
      color: COLOR_WHITE,
      bgColor: "#6b7280", // gray-500
      status: "healthy",
      description: "Unknown plant type",
    };
  }

  // Check if moisture is in healthy range
  if (
    moisturePercent >= config.healthy.min &&
    moisturePercent <= config.healthy.max
  ) {
    return MOISTURE_COLORS.healthy;
  }

  // Check if moisture is in caution range
  if (
    config.caution.some(
      (range) => moisturePercent >= range.min && moisturePercent <= range.max,
    )
  ) {
    return MOISTURE_COLORS.caution;
  }

  // Check if moisture is in problem range
  if (
    config.problem.some(
      (range) => moisturePercent >= range.min && moisturePercent <= range.max,
    )
  ) {
    return MOISTURE_COLORS.problem;
  }

  // Fallback
  return MOISTURE_COLORS.problem;
}

export function getMoistureTextColor(
  plantName: string,
  moisturePercent: number,
): string {
  const level = getMoistureLevel(plantName, moisturePercent);
  return level.color;
}

export function getMoistureBgColor(
  plantName: string,
  moisturePercent: number,
): string {
  const level = getMoistureLevel(plantName, moisturePercent);
  return level.bgColor;
}
