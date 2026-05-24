export type Point2 = { x: number; y: number };
export type TracePoint = { x: number; y: number; t: number };

export type MovingWaveConfig = {
  width: number;
  height: number;
  amplitude: number;
  wavelength: number;
  scrollSpeed: number;
  centerY?: number;
  phaseOffset?: number;
};

export const DEFAULT_TRACE_DURATION_MS = 10_000;
export const TRACE_ACCURACY_THRESHOLD_PX = 20;

/** Random delay for hidden-button phase (default 1.5–4.5 s). */
export function randomReactionDelayMs(minMs = 1500, maxMs = 4500): number {
  return minMs + Math.random() * (maxMs - minMs);
}

export function averageReactionMs(samples: readonly number[]): number {
  if (!samples.length) return 0;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}

export function mean(values: readonly number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function standardDeviation(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function percentSlower(nonDominantMs: number, dominantMs: number): number {
  if (!Number.isFinite(nonDominantMs) || !Number.isFinite(dominantMs) || dominantMs <= 0) return 0;
  return ((nonDominantMs - dominantMs) / dominantMs) * 100;
}

export type RankedEntry = { name: string; reactionMs: number; rank: number };

export function rankReactionTimes(entries: { name: string; reactionMs: number }[]): RankedEntry[] {
  const sorted = [...entries].sort((a, b) => a.reactionMs - b.reactionMs);
  return sorted.map((entry, i) => ({ ...entry, rank: i + 1 }));
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

export function combinedReactionScore(avgReactionMs: number, phase3AccuracyPct: number): number {
  const react = reactionScoreFromAvgMs(avgReactionMs);
  const trace = Math.max(0, Math.min(100, Math.round(phase3AccuracyPct)));
  return Math.min(100, Math.round((react + trace) / 2));
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

export function defaultMovingWaveConfig(width: number, height: number): MovingWaveConfig {
  const wavelength = width / 2;
  const scrollSpeed = (2 * wavelength) / DEFAULT_TRACE_DURATION_MS;
  return {
    width,
    height,
    amplitude: height * 0.25,
    wavelength,
    scrollSpeed,
    centerY: height / 2,
    phaseOffset: 0,
  };
}

/** Random wave parameters so each attempt looks different. */
export function randomMovingWaveConfig(width: number, height: number): MovingWaveConfig {
  const wavelength = width * (0.45 + Math.random() * 0.55);
  const scrollSpeed = (2 * wavelength) / DEFAULT_TRACE_DURATION_MS;
  return {
    width,
    height,
    amplitude: height * (0.18 + Math.random() * 0.17),
    wavelength,
    scrollSpeed,
    centerY: height / 2,
    phaseOffset: Math.random() * Math.PI * 2,
  };
}

/** y-position of scrolling sine wave at canvas x and elapsed time t (ms). */
export function movingWaveY(x: number, elapsedMs: number, config: MovingWaveConfig): number {
  const centerY = config.centerY ?? config.height / 2;
  const offset = config.scrollSpeed * elapsedMs;
  const phase = config.phaseOffset ?? 0;
  return (
    centerY + config.amplitude * Math.sin((2 * Math.PI * (x + offset)) / config.wavelength + phase)
  );
}

/** Sample the shape path over time for replay and delay calculation. */
export function sampleShapePath(
  config: MovingWaveConfig,
  durationMs: number,
  fps = 20,
): TracePoint[] {
  const samples: TracePoint[] = [];
  const stepMs = 1000 / fps;
  const startTs = Date.now();
  for (let elapsed = 0; elapsed <= durationMs; elapsed += stepMs) {
    const x = config.width / 2;
    const y = movingWaveY(x, elapsed, config);
    samples.push({ x, y, t: startTs + elapsed });
  }
  return samples;
}

/** Build a visible sine path across the canvas at a given elapsed time. */
export function movingWaveSvgPath(config: MovingWaveConfig, elapsedMs: number, steps = 48): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * config.width;
    const y = movingWaveY(x, elapsedMs, config);
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

/** Record shape positions at center-x over the challenge duration (relative timestamps). */
export function sampleShapeTrajectory(
  config: MovingWaveConfig,
  durationMs: number,
  startTs: number,
  fps = 20,
): TracePoint[] {
  const samples: TracePoint[] = [];
  const stepMs = 1000 / fps;
  const centerX = config.width / 2;
  for (let elapsed = 0; elapsed <= durationMs; elapsed += stepMs) {
    samples.push({
      x: centerX,
      y: movingWaveY(centerX, elapsed, config),
      t: startTs + elapsed,
    });
  }
  return samples;
}

/** Full visible wave polyline samples for replay overlay. */
export function sampleVisibleWavePath(
  config: MovingWaveConfig,
  elapsedMs: number,
  steps = 32,
): TracePoint[] {
  const pts: TracePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * config.width;
    pts.push({ x, y: movingWaveY(x, elapsedMs, config), t: elapsedMs });
  }
  return pts;
}

/** % of touch points within threshold px of the shape's true position at that timestamp. */
export function traceAccuracyPct(
  touchPoints: readonly TracePoint[],
  thresholdPx: number,
  config: MovingWaveConfig,
  challengeStartTs: number,
): number {
  if (!touchPoints.length) return 0;
  let hits = 0;
  for (const p of touchPoints) {
    const elapsed = p.t - challengeStartTs;
    const expectedY = movingWaveY(p.x, elapsed, config);
    const dist = Math.abs(p.y - expectedY);
    if (dist <= thresholdPx) hits++;
  }
  return (hits / touchPoints.length) * 100;
}

function closestShapeSample(
  touch: TracePoint,
  shapeSamples: readonly TracePoint[],
): TracePoint | null {
  if (!shapeSamples.length) return null;
  let best = shapeSamples[0];
  let bestDist = Infinity;
  for (const s of shapeSamples) {
    const dist = Math.hypot(touch.x - s.x, touch.y - s.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }
  return best;
}

/** Average time offset (ms) between touch and closest shape sample. */
export function traceAvgDelayMs(
  touchPoints: readonly TracePoint[],
  shapeSamples: readonly TracePoint[],
): number {
  if (!touchPoints.length || !shapeSamples.length) return 0;
  let total = 0;
  for (const touch of touchPoints) {
    const closest = closestShapeSample(touch, shapeSamples);
    if (closest) total += Math.abs(touch.t - closest.t);
  }
  return total / touchPoints.length;
}

/** Downsample trace points for storage/export (keeps first, last, and evenly spaced middle). */
export function downsampleTracePoints(
  points: readonly TracePoint[],
  maxPoints = 150,
): TracePoint[] {
  if (points.length <= maxPoints) return [...points];
  const result: TracePoint[] = [points[0]!];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 1; i < maxPoints - 1; i++) {
    result.push(points[Math.round(i * step)]!);
  }
  result.push(points[points.length - 1]!);
  return result;
}

/** Ideal finger trace: follow the wave at the horizontal centre over time. */
export function buildIdealFingerTrace(
  config: MovingWaveConfig,
  durationMs: number,
  fps = 20,
): TracePoint[] {
  const pts: TracePoint[] = [];
  const stepMs = 1000 / fps;
  const centerX = config.width / 2;
  for (let elapsed = 0; elapsed <= durationMs; elapsed += stepMs) {
    pts.push({ x: centerX, y: movingWaveY(centerX, elapsed, config), t: elapsed });
  }
  return pts;
}

/** Full visible wave polylines at several moments (for replay overlay). */
export function buildWaveSnapshotPaths(
  config: MovingWaveConfig,
  durationMs: number,
  snapshots = 5,
): TracePoint[][] {
  const paths: TracePoint[][] = [];
  for (let i = 0; i < snapshots; i++) {
    const elapsed = snapshots <= 1 ? 0 : (i / (snapshots - 1)) * durationMs;
    paths.push(sampleVisibleWavePath(config, elapsed));
  }
  return paths;
}

/** Build replay shape path: ideal finger trace over the challenge duration. */
export function buildReplayShapePath(
  config: MovingWaveConfig,
  durationMs: number,
  fps = 10,
): TracePoint[] {
  return buildIdealFingerTrace(config, durationMs, fps);
}
