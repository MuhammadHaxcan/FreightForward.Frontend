/**
 * Calculates CBM (Cubic Meters) from dimensions.
 * Returns undefined if any dimension is 0 or missing.
 */
export const calculateCbm = (
  length?: number,
  width?: number,
  height?: number,
  volumeUnit?: string
): number | undefined => {
  const l = length || 0;
  const w = width || 0;
  const h = height || 0;
  if (l <= 0 || w <= 0 || h <= 0) return undefined;
  const raw = l * w * h;
  if (volumeUnit === "inch") return raw / 61_024;
  if (volumeUnit === "meter") return raw;
  // Default: centimeters
  return raw / 1_000_000;
};
