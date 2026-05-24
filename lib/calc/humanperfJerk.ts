export type Vec3 = { x: number; y: number; z: number };

export type AccelSample = Vec3 & { t: number };

export type JerkSeriesPoint = { t: number; jerkMm: number };

export type SmoothnessRating = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export type AttemptAggregate = {
  avgJerkMm: number;
  peakJerkMm: number;
  durationSec: number;
  jerkSeries: JerkSeriesPoint[];
};

export type MovementAttemptSummary = {
  movement: 1 | 2 | 3;
  avgJerkMm: number;
};

/** Scale raw g-delta jerk into display mm units for rating bands. */
export const JERK_MM_SCALE = 1000;

export const JERK_DISPLAY_MAX = 50;

export const SAMPLE_HZ = 100;

const COLOR_GREEN = '#50C878';
const COLOR_YELLOW = '#E8A838';
const COLOR_RED = '#E74C3C';

function vecMagnitude(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function computeJerkMm(prev: Vec3, curr: Vec3): number {
  const delta = Math.abs(vecMagnitude(curr) - vecMagnitude(prev));
  return delta * JERK_MM_SCALE;
}

export function smoothnessRating(avgJerkMm: number): SmoothnessRating {
  if (avgJerkMm < 5) return 'Excellent';
  if (avgJerkMm < 15) return 'Good';
  if (avgJerkMm < 30) return 'Fair';
  return 'Poor';
}

export function ratingColor(rating: SmoothnessRating): string {
  switch (rating) {
    case 'Excellent':
      return COLOR_GREEN;
    case 'Good':
      return COLOR_YELLOW;
    case 'Fair':
      return '#E67E22';
    case 'Poor':
      return COLOR_RED;
  }
}

/** Green (low jerk) → yellow → red (high jerk). */
export function jerkBarColor(jerkMm: number): string {
  const clamped = Math.min(JERK_DISPLAY_MAX, Math.max(0, jerkMm));
  if (clamped < 5) return COLOR_GREEN;
  if (clamped < 15) return COLOR_YELLOW;
  if (clamped < 30) return '#E67E22';
  return COLOR_RED;
}

export function aggregateAttempt(samples: AccelSample[]): AttemptAggregate {
  if (samples.length < 2) {
    return { avgJerkMm: 0, peakJerkMm: 0, durationSec: 0, jerkSeries: [] };
  }

  const jerkSeries: JerkSeriesPoint[] = [];
  let sum = 0;
  let peak = 0;

  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1];
    const curr = samples[i];
    if (!prev || !curr) continue;
    const jerkMm = computeJerkMm(prev, curr);
    jerkSeries.push({ t: curr.t - samples[0]!.t, jerkMm });
    sum += jerkMm;
    peak = Math.max(peak, jerkMm);
  }

  const count = jerkSeries.length;
  const durationSec = count > 0 ? (samples[samples.length - 1]!.t - samples[0]!.t) / 1000 : 0;

  return {
    avgJerkMm: count > 0 ? sum / count : 0,
    peakJerkMm: peak,
    durationSec,
    jerkSeries,
  };
}

export function hardestMovement(
  attempts: MovementAttemptSummary[],
): { movement: 1 | 2 | 3; avgJerkMm: number } | null {
  if (attempts.length === 0) return null;
  let best = attempts[0]!;
  for (const a of attempts) {
    if (a.avgJerkMm > best.avgJerkMm) best = a;
  }
  return { movement: best.movement, avgJerkMm: best.avgJerkMm };
}

export function scoreFromAttempts(attempts: MovementAttemptSummary[]): number {
  if (attempts.length === 0) return 0;
  const avg = attempts.reduce((sum, a) => sum + a.avgJerkMm, 0) / Math.max(1, attempts.length);
  return Math.max(0, Math.round(100 - Math.min(100, avg * 2)));
}
