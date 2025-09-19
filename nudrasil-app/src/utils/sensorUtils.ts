/**
 * Calculates moisture percentage from raw value based on sensor calibration data
 * High Value = Dry, Low Value = Wet
 */
export function calculateMoisturePercent(
  rawValue: number,
  soilMin: number,
  soilMax: number,
): number {
  const clamped = Math.max(Math.min(rawValue, soilMax), soilMin);
  return Math.round(((soilMax - clamped) / (soilMax - soilMin)) * 100);
}
