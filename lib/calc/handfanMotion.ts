/** Map accelerometer magnitude swing (g) to estimated fan bend shift (px). */
export function shiftPxFromAccelSwing(peakDeviationG: number): number {
  if (!Number.isFinite(peakDeviationG) || peakDeviationG <= 0) return 0;
  return Math.round(peakDeviationG * 80);
}
