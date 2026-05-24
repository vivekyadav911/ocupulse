export type Point2 = { x: number; y: number };

/** Bend angle (degrees) between vertical baseline and line from origin to touch point. */
export function angleBetweenVerticalDeg(
  touchX: number,
  touchY: number,
  originX: number,
  originY: number,
): number {
  const dx = touchX - originX;
  const dy = originY - touchY;
  if (dy <= 0) return 90;
  const rad = Math.atan2(Math.abs(dx), dy);
  const deg = (rad * 180) / Math.PI;
  return Math.max(0, Math.min(90, Math.round(deg)));
}

/** Endpoints for a line from origin at angleDeg from vertical (0° = straight up). */
export function lineEndpoints(
  origin: Point2,
  length: number,
  angleFromVerticalDeg: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const rad = (angleFromVerticalDeg * Math.PI) / 180;
  const dx = length * Math.sin(rad);
  const dy = length * Math.cos(rad);
  return {
    x1: origin.x,
    y1: origin.y,
    x2: origin.x + dx,
    y2: origin.y - dy,
  };
}

/** Vertical baseline endpoints (straight up from origin). */
export function baselineEndpoints(
  origin: Point2,
  length: number,
): { x1: number; y1: number; x2: number; y2: number } {
  return {
    x1: origin.x,
    y1: origin.y,
    x2: origin.x,
    y2: origin.y - length,
  };
}
