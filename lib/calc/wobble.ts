/** Lower RMS accelerometer magnitude (m/s²) during shake window → higher structural stability score (0–100). */
export function wobbleScoreFromRms(rmsMs2: number): number {
  if (!Number.isFinite(rmsMs2) || rmsMs2 <= 0) return 100;
  const scaled = 100 - Math.min(100, rmsMs2 * 2);
  return Math.max(0, Math.round(scaled));
}
