export enum PlantType {
  SPIDER_PLANT = "spider_plant",
  DEVILS_IVY = "devils_ivy",
}

export interface PlantZone {
  range?: [number, number];
  range_low?: [number, number];
  range_high?: [number, number];
  description: string;
}

export interface PlantZones {
  green: PlantZone;
  yellow: PlantZone;
  red: PlantZone;
}

export interface PlantConfig {
  name: string;
  zones: PlantZones;
}

export interface PlantZonesConfig {
  plants: Record<PlantType, PlantConfig>;
}

export const PLANT_ZONES: PlantZonesConfig = {
  plants: {
    [PlantType.SPIDER_PLANT]: {
      name: "Spider Plant",
      zones: {
        green: {
          range: [35, 55],
          description:
            "Ideal moisture range. Soil is lightly moist and supports healthy growth.",
        },
        yellow: {
          range_low: [25, 34],
          range_high: [56, 65],
          description:
            "Caution. Slightly dry or slightly wet. Acceptable short term but may stress the plant.",
        },
        red: {
          range_low: [0, 24],
          range_high: [66, 100],
          description:
            "Warning. Too dry or too wet. Risk of leaf tip browning or root rot.",
        },
      },
    },
    [PlantType.DEVILS_IVY]: {
      name: "Devil's Ivy",
      zones: {
        green: {
          range: [30, 50],
          description:
            "Ideal moisture range. Slightly damp but allows air circulation around roots.",
        },
        yellow: {
          range_low: [20, 29],
          range_high: [51, 65],
          description:
            "Caution. Borderline dry or wet. Leaves may start to droop or yellow.",
        },
        red: {
          range_low: [0, 19],
          range_high: [66, 100],
          description:
            "Warning. Prolonged dryness or saturation can cause leaf loss or root rot.",
        },
      },
    },
  },
};

/**
 * Gets plant zones configuration for a plant type
 */
export function getPlantZonesForType(
  plantType: PlantType | null | undefined,
): PlantZones | null {
  if (!plantType) {
    return null;
  }

  return PLANT_ZONES.plants[plantType]?.zones || null;
}
