/** MVP placeholder: map centroid shift in pixels to an approximate bend angle (degrees). */
export function bendAngleFromShiftPixels(shiftPx: number, armLengthMm = 120): number {
  if (!Number.isFinite(shiftPx) || armLengthMm <= 0) return 0;
  const rad = Math.atan2(shiftPx, armLengthMm);
  return Math.round((rad * 180) / Math.PI);
}
