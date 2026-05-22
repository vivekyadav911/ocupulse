export type Point2 = { x: number; y: number };

/** Random delay for hidden-button phase (default 1–5 s). */
export function randomReactionDelayMs(minMs = 1000, maxMs = 5000): number {
  return minMs + Math.random() * (maxMs - minMs);
}

export function averageReactionMs(samples: readonly number[]): number {
  if (!samples.length) return 0;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}

/** Maps average reaction time to 0–100 (200 ms ≈ best, 400 ms ≈ typical mid). */
export function reactionScoreFromAvgMs(avgMs: number): number {
  if (!Number.isFinite(avgMs) || avgMs <= 0) return 0;
  const clamped = Math.max(150, Math.min(600, avgMs));
  return Math.max(0, Math.round(100 - ((clamped - 200) / 400) * 100));
}

/** Ideal trace path y for normalized x ∈ [0, 1]. */
export function idealTraceY(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return 0.5 + 0.35 * Math.sin(2 * Math.PI * t);
}

/** Mean squared error vs the ideal sine path (normalized screen coordinates). */
export function tracePathMse(userPoints: readonly Point2[]): number {
  if (!userPoints.length) return 1;
  let sum = 0;
  for (const p of userPoints) {
    const idealScreenY = 1 - idealTraceY(p.x);
    sum += (p.y - idealScreenY) ** 2;
  }
  return sum / userPoints.length;
}

/** Lower MSE → higher score (0–100). */
export function traceScoreFromMse(mse: number): number {
  if (!Number.isFinite(mse) || mse < 0) return 0;
  return Math.max(0, Math.round(100 - Math.min(100, mse * 500)));
}

export function combinedReactionScore(avgReactionMs: number, traceScore: number): number {
  const react = reactionScoreFromAvgMs(avgReactionMs);
  return Math.min(100, Math.round((react + traceScore) / 2));
}

/** Build SVG path `d` for the ideal sine (width/height in px). */
export function idealTraceSvgPath(width: number, height: number, steps = 48): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const xNorm = i / steps;
    const x = xNorm * width;
    const y = (1 - idealTraceY(xNorm)) * height;
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}
