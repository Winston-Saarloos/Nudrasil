export interface SensorConfig {
  id: number;
  name: string;
  type: "temperature" | "humidity" | "light" | "soil";
  unit: string;
  description: string;
  color: string;
  conversion?: (value: number) => number;
}

export const SENSOR_CONFIGS: Record<string, SensorConfig> = {
  temperature: {
    id: 1,
    name: "Temperature",
    type: "temperature",
    unit: "°F",
    description: "Ambient temperature",
    color: "#ef4444", // Red-500
    conversion: (value: number) => (value * 9) / 5 + 32, // Convert Celsius to Fahrenheit
  },
  humidity: {
    id: 2,
    name: "Humidity",
    type: "humidity",
    unit: "%",
    description: "Relative humidity",
    color: "#3b82f6", // Blue-500
  },
  light: {
    id: 4,
    name: "Light",
    type: "light",
    unit: "lux",
    description: "Ambient light level",
    color: "#f59e0b", // Amber-500
    conversion: (value: number) => (value === -1 ? 0 : value), // Handle -1 values
  },
  soil1: {
    id: 3,
    name: "Spider Plant 1",
    type: "soil",
    unit: "%",
    description: "Soil moisture for Spider Plant 1",
    color: "#06b6d4", // Cyan-500
  },
  soil2: {
    id: 9,
    name: "Spider Plant 2",
    type: "soil",
    unit: "%",
    description: "Soil moisture for Spider Plant 2",
    color: "#8b5cf6", // Violet-500
  },
  soil3: {
    id: 10,
    name: "Devil's Ivy",
    type: "soil",
    unit: "%",
    description: "Soil moisture for Devil's Ivy",
    color: "#10b981", // Emerald-500
  },
};

// Helper functions to get sensor configs by type
export function getSensorsByType(type: SensorConfig["type"]): SensorConfig[] {
  return Object.values(SENSOR_CONFIGS).filter((sensor) => sensor.type === type);
}

export function getSensorConfig(key: string): SensorConfig | undefined {
  return SENSOR_CONFIGS[key];
}

export function getSensorConfigById(id: number): SensorConfig | undefined {
  return Object.values(SENSOR_CONFIGS).find((sensor) => sensor.id === id);
}

// Get all sensor keys for easy iteration
export const SENSOR_KEYS = Object.keys(SENSOR_CONFIGS) as Array<
  keyof typeof SENSOR_CONFIGS
>;
