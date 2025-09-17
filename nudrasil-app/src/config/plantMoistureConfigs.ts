import { PlantMoistureConfig } from "@/utils/moistureColorUtils";

// Shared moisture configurations
const SPIDER_PLANT_CONFIG: PlantMoistureConfig = {
  healthy: { min: 30, max: 50 },
  caution: [
    { min: 20, max: 29 }, // Getting dry
    { min: 51, max: 60 }, // A bit too wet
  ],
  problem: [
    { min: 0, max: 19 }, // Too dry
    { min: 61, max: 100 }, // Too wet
  ],
};

const DEVILS_IVY_CONFIG: PlantMoistureConfig = {
  healthy: { min: 20, max: 40 },
  caution: [
    { min: 15, max: 19 }, // Getting dry
    { min: 41, max: 50 }, // A bit too wet
  ],
  problem: [
    { min: 0, max: 14 }, // Too dry
    { min: 51, max: 100 }, // Too wet
  ],
};

// Soil Moisture requirements for color coding
export const PLANT_MOISTURE_CONFIGS: Record<string, PlantMoistureConfig> = {
  "Spider Plant 1": SPIDER_PLANT_CONFIG,
  "Spider Plant 2": SPIDER_PLANT_CONFIG,
  "Devil's Ivy": DEVILS_IVY_CONFIG,
};
