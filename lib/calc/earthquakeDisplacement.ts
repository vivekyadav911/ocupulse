export type EarthquakeRating = 'excellent' | 'good' | 'fair' | 'poor';

export type AccelSample = {
  x: number;
  y: number;
  z: number;
  t: number;
};

export type EarthquakeReadings = {
  totalDisplacementCm: number;
  peakXCm: number;
  peakYCm: number;
  peakZCm: number;
  peakDisplacementCm: number;
  maxTiltDeg: number;
  rating: EarthquakeRating;
  sampleCount: number;
};

/** Expected sampling rate (Hz) for the earthquake test. */
export const SAMPLE_HZ = 60;

/**
 * Converts cumulative high-passed g-delta sums to centimeters.
 * Previous factor (2.5) produced millimeter-scale values labelled as cm.
 */
export const G_DELTA_TO_CM = 0.25;

/** High-pass filter strength (0–1). Higher = more gravity/orientation rejection. */
const HIGH_PASS_ALPHA = 0.85;

const RATING_COLORS: Record<EarthquakeRating, string> = {
  excellent: '#22C55E',
  good: '#14B8A6',
  fair: '#F59E0B',
  poor: '#EF4444',
};

export function ratingFromPeakCm(cm: number): EarthquakeRating {
  if (!Number.isFinite(cm) || cm < 0) return 'poor';
  if (cm < 0.5) return 'excellent';
  if (cm < 1) return 'good';
  if (cm < 2) return 'fair';
  return 'poor';
}

export function ratingLabel(rating: EarthquakeRating): string {
  switch (rating) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'fair':
      return 'Fair';
    case 'poor':
      return 'Poor';
  }
}

export function ratingColor(rating: EarthquakeRating): string {
  return RATING_COLORS[rating];
}

export function stabilityScoreFromPeakCm(cm: number): number {
  if (!Number.isFinite(cm) || cm <= 0) return 100;
  const penalty = 50;
  return Math.max(0, Math.round(100 - Math.min(100, cm * penalty)));
}

type HighPassState = {
  lpX: number;
  lpY: number;
  lpZ: number;
  prevHpX: number;
  prevHpY: number;
  prevHpZ: number;
};

function initHighPass(first: AccelSample): HighPassState {
  return {
    lpX: first.x,
    lpY: first.y,
    lpZ: first.z,
    prevHpX: 0,
    prevHpY: 0,
    prevHpZ: 0,
  };
}

/** One-pole high-pass per axis to reduce gravity/orientation drift in displacement sums. */
function stepHighPass(state: HighPassState, sample: AccelSample): HighPassState {
  const lpX = HIGH_PASS_ALPHA * state.lpX + (1 - HIGH_PASS_ALPHA) * sample.x;
  const lpY = HIGH_PASS_ALPHA * state.lpY + (1 - HIGH_PASS_ALPHA) * sample.y;
  const lpZ = HIGH_PASS_ALPHA * state.lpZ + (1 - HIGH_PASS_ALPHA) * sample.z;
  return {
    lpX,
    lpY,
    lpZ,
    prevHpX: sample.x - lpX,
    prevHpY: sample.y - lpY,
    prevHpZ: sample.z - lpZ,
  };
}

export function computeEarthquakeReadings(samples: readonly AccelSample[]): EarthquakeReadings {
  if (samples.length === 0) {
    return {
      totalDisplacementCm: 0,
      peakXCm: 0,
      peakYCm: 0,
      peakZCm: 0,
      peakDisplacementCm: 0,
      maxTiltDeg: 0,
      rating: 'excellent',
      sampleCount: 0,
    };
  }

  let hp = initHighPass(samples[0]!);
  let prevHp = { x: 0, y: 0, z: 0 };

  let totalDeltaG = 0;
  let cumX = 0;
  let cumY = 0;
  let cumZ = 0;
  let peakX = 0;
  let peakY = 0;
  let peakZ = 0;
  let maxTiltDeg = 0;

  for (let i = 0; i < samples.length; i++) {
    const curr = samples[i]!;
    const tiltDeg = Math.abs(Math.atan2(curr.y, curr.x) * (180 / Math.PI));
    if (tiltDeg > maxTiltDeg) maxTiltDeg = tiltDeg;

    hp = stepHighPass(hp, curr);
    const hpX = hp.prevHpX;
    const hpY = hp.prevHpY;
    const hpZ = hp.prevHpZ;

    if (i === 0) {
      prevHp = { x: hpX, y: hpY, z: hpZ };
      continue;
    }

    const dx = hpX - prevHp.x;
    const dy = hpY - prevHp.y;
    const dz = hpZ - prevHp.z;
    prevHp = { x: hpX, y: hpY, z: hpZ };

    totalDeltaG += Math.sqrt(dx * dx + dy * dy + dz * dz);
    cumX += Math.abs(dx);
    cumY += Math.abs(dy);
    cumZ += Math.abs(dz);
    peakX = Math.max(peakX, cumX);
    peakY = Math.max(peakY, cumY);
    peakZ = Math.max(peakZ, cumZ);
  }

  const peakXCm = peakX * G_DELTA_TO_CM;
  const peakYCm = peakY * G_DELTA_TO_CM;
  const peakZCm = peakZ * G_DELTA_TO_CM;
  const peakDisplacementCm = Math.max(peakXCm, peakYCm, peakZCm);
  const totalDisplacementCm = totalDeltaG * G_DELTA_TO_CM;

  return {
    totalDisplacementCm: round2(totalDisplacementCm),
    peakXCm: round2(peakXCm),
    peakYCm: round2(peakYCm),
    peakZCm: round2(peakZCm),
    peakDisplacementCm: round2(peakDisplacementCm),
    maxTiltDeg: round2(maxTiltDeg),
    rating: ratingFromPeakCm(peakDisplacementCm),
    sampleCount: samples.length,
  };
}

export type DesignRunSummary = {
  design: 1 | 2 | 3;
  folds: number;
  pillars: number;
  peakDisplacementCm: number;
};

export type EarthquakeSummary = {
  bestDesign: 1 | 2 | 3 | null;
  winningFolds: number | null;
  winningPillars: number | null;
  bestPeakCm: number | null;
};

export function summarizeDesignRuns(runs: readonly DesignRunSummary[]): EarthquakeSummary {
  const completed = runs.filter((r) => Number.isFinite(r.peakDisplacementCm));
  if (completed.length === 0) {
    return { bestDesign: null, winningFolds: null, winningPillars: null, bestPeakCm: null };
  }

  const best = completed.reduce((a, b) => (a.peakDisplacementCm <= b.peakDisplacementCm ? a : b));

  return {
    bestDesign: best.design,
    winningFolds: best.folds,
    winningPillars: best.pillars,
    bestPeakCm: best.peakDisplacementCm,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
