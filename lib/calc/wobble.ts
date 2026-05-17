/** RMS of accelerometer magnitude samples (same units as input, typically |a| in g). */
export function magnitudeRms(samples: readonly number[]): number {
  if (!samples.length) return 0;
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const sumSq = samples.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  return Math.sqrt(sumSq / samples.length);
}

/**
 * Structural stability score (0–100): inverse of wobble RMS.
 * Calibrated so a steady platform scores &gt;80 and a loose/wobbly one &lt;40.
 */
export function wobbleScoreFromRms(rmsG: number): number {
  if (!Number.isFinite(rmsG) || rmsG <= 0) return 100;
  const penalty = 150;
  return Math.max(0, Math.round(100 - Math.min(100, rmsG * penalty)));
}
