export enum PlantType {
  SPIDER_PLANT = "spider_plant",
  DEVILS_IVY = "devils_ivy",
}

export interface PlantZone {
  range?: [number, number];
  range_low?: [number, number];
  range_high?: [number, number];
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
          range: [26, 59],
        },
        yellow: {
          range_low: [16, 25],
          range_high: [60, 69],
        },
        red: {
          range_low: [0, 15],
          range_high: [70, 100],
        },
      },
    },
    [PlantType.DEVILS_IVY]: {
      name: "Devil's Ivy",
      zones: {
        green: {
          range: [26, 54],
        },
        yellow: {
          range_low: [20, 25],
          range_high: [55, 65],
        },
        red: {
          range_low: [0, 19],
          range_high: [66, 100],
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
