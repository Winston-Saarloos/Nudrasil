/**
 * Calculates moisture percentage from raw value based on sensor calibration data
 */
export function calculateMoisturePercent(
  rawValue: number,
  soilMin: number,
  soilMax: number,
): number {
  const clamped = Math.max(Math.min(rawValue, soilMax), soilMin);
  return Math.round(((clamped - soilMin) / (soilMax - soilMin)) * 100);
}
