/** Device-frame acceleration vector (m/s²). */
export type AccelVec3 = { x: number; y: number; z: number };

/** One timestamped accel sample (m/s², t in ms). */
export type AccelTimelineSample = AccelVec3 & { t: number; magnitude?: number };

export type ImpactImpulseEstimate = {
  /** Duration of inferred contact window (s). */
  contactTimeS: number | null;
  /** Approximate mod of \(\int \mathbf{a}\,\mathrm{d}t\) over the window (m/s). */
  deltaVMps: number | null;
  peakMagnitudeMs2: number | null;
  startIndex: number | null;
  endIndex: number | null;
};

const DEFAULT_MIN_PEAK = 8;
const DEFAULT_RELATIVE_CUTOFF = 0.28;

function magOf(sample: AccelTimelineSample): number {
  if (sample.magnitude !== undefined && Number.isFinite(sample.magnitude)) return sample.magnitude;
  return Math.sqrt(sample.x * sample.x + sample.y * sample.y + sample.z * sample.z);
}

/**
 * Trapzoidal integration \(\int \mathbf{a}\,\mathrm{d}t\) in device axes (indices inclusive).
 */
export function integrateAccelDeltaVVect(
  samples: AccelTimelineSample[],
  startIdx: number,
  endIdx: number,
): AccelVec3 | null {
  if (samples.length === 0 || startIdx > endIdx) return null;
  const lo = Math.max(0, startIdx);
  const hi = Math.min(samples.length - 1, endIdx);
  if (lo >= hi) {
    const s = samples[lo]!;
    const dtMs = Math.max(0.001, 16);
    const dt = dtMs / 1000;
    return { x: s.x * dt, y: s.y * dt, z: s.z * dt };
  }

  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;

  for (let i = lo; i < hi; i += 1) {
    const a = samples[i]!;
    const b = samples[i + 1]!;
    let dtMs = b.t - a.t;
    if (!Number.isFinite(dtMs) || dtMs <= 0) dtMs = 1;
    const dtSec = dtMs / 1000;
    sumX += 0.5 * (a.x + b.x) * dtSec;
    sumY += 0.5 * (a.y + b.y) * dtSec;
    sumZ += 0.5 * (a.z + b.z) * dtSec;
  }

  return { x: sumX, y: sumY, z: sumZ };
}

export function vectorMagnitude(v: AccelVec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export type EstimateImpactImpulseOpts = {
  /** Ignore peaks below this (m/s²). */
  minPeakMs2?: number;
  /** Left/right dilation: `cutoffMag = max(minPeakMs2 * 0.5, peakMag * relativeCutoff)`. */
  relativeCutoff?: number;
};

const emptyEstimate = (): ImpactImpulseEstimate => ({
  contactTimeS: null,
  deltaVMps: null,
  peakMagnitudeMs2: null,
  startIndex: null,
  endIndex: null,
});

/**
 * Find largest spike contiguous window by magnitude; derive contact time + Δ|\v| from linear accel.
 */
export function estimateImpactImpulse(
  samples: AccelTimelineSample[],
  opts: EstimateImpactImpulseOpts = {},
): ImpactImpulseEstimate {
  const minPeakMs2 = opts.minPeakMs2 ?? DEFAULT_MIN_PEAK;
  const relativeCutoff = opts.relativeCutoff ?? DEFAULT_RELATIVE_CUTOFF;

  if (samples.length < 3) return emptyEstimate();

  const mags = samples.map((s) => magOf(s));
  let peakIdx = 0;
  let peakVal = -Infinity;
  for (let i = 0; i < mags.length; i += 1) {
    if (mags[i]! > peakVal) {
      peakVal = mags[i]!;
      peakIdx = i;
    }
  }

  if (!Number.isFinite(peakVal) || peakVal < minPeakMs2) return emptyEstimate();

  const cutoffMag = Math.max(minPeakMs2 * 0.5, peakVal * relativeCutoff);

  let startIdx = peakIdx;
  while (startIdx > 0 && mags[startIdx - 1]! >= cutoffMag) {
    startIdx -= 1;
  }

  let endIdx = peakIdx;
  while (endIdx < mags.length - 1 && mags[endIdx + 1]! >= cutoffMag) {
    endIdx += 1;
  }

  const t0 = samples[startIdx]!.t;
  const t1 = samples[endIdx]!.t;
  const spanMs = t1 - t0;
  const contactTimeS = spanMs > 0 ? spanMs / 1000 : null;

  const deltaVvect = integrateAccelDeltaVVect(samples, startIdx, endIdx);
  const deltaVMps = deltaVvect ? vectorMagnitude(deltaVvect) : null;

  return {
    contactTimeS: contactTimeS !== null ? Math.max(contactTimeS, 1 / 1000) : null,
    deltaVMps,
    peakMagnitudeMs2: peakVal,
    startIndex: startIdx,
    endIndex: endIdx,
  };
}
