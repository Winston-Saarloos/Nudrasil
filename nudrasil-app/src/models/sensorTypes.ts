export interface SensorReading {
  value: number;
  readingTime: string;
}

export interface CalibrationData {
  min: number;
  max: number;
}

export interface ChartPoint {
  timestamp: string;
  time: string;
  temp?: number;
  humidity?: number;
  light?: number;
  soil1?: number;
  soil2?: number;
  soil3?: number;
}

export type NumericKeys = Exclude<
  {
    [K in keyof ChartPoint]: ChartPoint[K] extends number | undefined
      ? K
      : never;
  }[keyof ChartPoint],
  undefined
>;

export interface SensorDataResponse {
  data: SensorReading[];
}

export interface CalibrationResponse {
  data: CalibrationData;
}

