import {
  amplifyBreathingSignal,
  BREATHING_SAMPLE_MS,
  lowPassSmooth,
  SENSITIVITY_GAIN,
  type WaveformPoint,
} from './breathingSignal';

export type Vec3 = { x: number; y: number; z: number };

/** Axis weights — Z leads for chest placement; X/Y capture roll and lateral chest motion. */
export const AXIS_WEIGHTS = { x: 0.35, y: 0.35, z: 0.55 } as const;

const BASELINE_ALPHA = 0.00035;
const SIGNAL_BASELINE_ALPHA = 0.008;
const RECENT_SIGNAL_CAP = Math.ceil((5 * 1000) / BREATHING_SAMPLE_MS);
const EXTREMA_HISTORY_CAP = 6;

/** Minimum peak↔trough depth after gain (rejects isolated micro-spikes). */
const ABS_WAVE_DEPTH_FLOOR_G = 0.0012;

/** Minimum time between counted breath peaks. */
export const MIN_PEAK_GAP_MS = 1000;

export type AxisBaseline = Vec3;
export type ExtremumKind = 'peak' | 'trough';

export type ConfirmedExtremum = {
  kind: ExtremumKind;
  value: number;
  t: number;
};

export type ProcessAxisOptions = {
  /** Lock gravity baseline during recording so tiny chest motion is not cancelled out. */
  freezeAxisBaseline?: boolean;
};

export type StreamingBreathDetectorState = {
  baseline: AxisBaseline;
  smoothed: number;
  signalBaseline: number;
  recentSignals: number[];
  /** 5-sample delay line for robust peak/trough detection. */
  lag5: number[];
  lag5T: number[];
  extrema: ConfirmedExtremum[];
  /** Keys `${tA}-${tB}-${tC}` for P-T-P / T-P-T waves already counted. */
  countedWaves: string[];
  lastBreathTime: number;
  breathTimes: number[];
};

export function createStreamingBreathDetector(initial: Vec3): StreamingBreathDetectorState {
  return {
    baseline: { ...initial },
    smoothed: 0,
    signalBaseline: 0,
    recentSignals: [],
    lag5: [],
    lag5T: [],
    extrema: [],
    countedWaves: [],
    lastBreathTime: 0,
    breathTimes: [],
  };
}

export function updateAxisBaseline(baseline: AxisBaseline, raw: Vec3): AxisBaseline {
  const keep = 1 - BASELINE_ALPHA;
  return {
    x: baseline.x * keep + raw.x * BASELINE_ALPHA,
    y: baseline.y * keep + raw.y * BASELINE_ALPHA,
    z: baseline.z * keep + raw.z * BASELINE_ALPHA,
  };
}

export function combinedAxisSignal(raw: Vec3, baseline: AxisBaseline): number {
  const dx = raw.x - baseline.x;
  const dy = raw.y - baseline.y;
  const dz = raw.z - baseline.z;
  const { x: wx, y: wy, z: wz } = AXIS_WEIGHTS;
  return Math.sqrt(wx * dx * dx + wy * dy * dy + wz * dz * dz);
}

/** Minimum peak↔trough depth derived from recent graph amplitude. */
export function adaptiveWaveDepth(recentSignals: number[]): number {
  const absFloor = ABS_WAVE_DEPTH_FLOOR_G * SENSITIVITY_GAIN;

  if (recentSignals.length < 8) {
    return absFloor;
  }

  let min = recentSignals[0]!;
  let max = recentSignals[0]!;
  const diffs: number[] = [];

  for (let i = 0; i < recentSignals.length; i += 1) {
    const v = recentSignals[i]!;
    min = Math.min(min, v);
    max = Math.max(max, v);
    if (i > 0) {
      diffs.push(Math.abs(v - recentSignals[i - 1]!));
    }
  }

  diffs.sort((a, b) => a - b);
  const noise = diffs[Math.floor(diffs.length / 2)] ?? 0;
  const range = max - min;

  const fromRange = range * 0.12;
  const fromNoise = noise * 2.4;

  return Math.max(absFloor, Math.min(fromRange, Math.max(fromNoise, absFloor)));
}

/** @deprecated alias */
export const adaptiveMinProminence = adaptiveWaveDepth;

function pushRecent(recent: number[], value: number): number[] {
  const next = recent.length >= RECENT_SIGNAL_CAP ? recent.slice(1) : recent.slice();
  next.push(value);
  return next;
}

export type WaveBreathResult = {
  breathTimes: number[];
  lastBreathTime: number;
};

/** Within a cluster of peaks closer than minGapMs, keep only the highest. */
export function collapsePeaksWithinGap(
  peaks: ConfirmedExtremum[],
  gapMs: number = MIN_PEAK_GAP_MS,
): ConfirmedExtremum[] {
  const sorted = [...peaks].sort((a, b) => a.t - b.t);
  if (sorted.length === 0) return [];

  const collapsed: ConfirmedExtremum[] = [];
  let clusterStart = sorted[0]!;
  let clusterBest = sorted[0]!;

  for (let i = 1; i < sorted.length; i += 1) {
    const peak = sorted[i]!;
    if (peak.t - clusterStart.t < gapMs) {
      if (peak.value > clusterBest.value) clusterBest = peak;
    } else {
      collapsed.push(clusterBest);
      clusterStart = peak;
      clusterBest = peak;
    }
  }

  collapsed.push(clusterBest);
  return collapsed;
}

export function deepestTroughBetween(
  troughs: ConfirmedExtremum[],
  startT: number,
  endT: number,
): ConfirmedExtremum | null {
  let deepest: ConfirmedExtremum | null = null;
  for (const trough of troughs) {
    if (trough.t <= startT || trough.t >= endT) continue;
    if (!deepest || trough.value < deepest.value) deepest = trough;
  }
  return deepest;
}

/**
 * Valid breath = highest peak in each ≥1 s cluster, paired with the deepest trough
 * between the previous accepted peak and this peak.
 */
export function selectBreathPeaksFromExtrema(
  extrema: ConfirmedExtremum[],
  minDepth: number,
  minGapMs: number = MIN_PEAK_GAP_MS,
): number[] {
  const peaks = collapsePeaksWithinGap(
    extrema.filter((e) => e.kind === 'peak'),
    minGapMs,
  );
  const troughs = extrema.filter((e) => e.kind === 'trough');

  const accepted: number[] = [];
  let lastPeakT = -Infinity;

  for (const peak of peaks) {
    if (lastPeakT > 0 && peak.t - lastPeakT < minGapMs) continue;

    const trough = deepestTroughBetween(troughs, lastPeakT, peak.t);
    if (!trough) continue;
    if (peak.value - trough.value < minDepth) continue;

    accepted.push(peak.t);
    lastPeakT = peak.t;
  }

  return accepted;
}

/**
 * @deprecated Use selectBreathPeaksFromExtrema — kept for tests.
 */
export function breathFromPeak(
  peak: ConfirmedExtremum,
  minDepth: number,
  lastBreathTime: number,
  trough?: ConfirmedExtremum | null,
): WaveBreathResult {
  if (peak.kind !== 'peak') {
    return { breathTimes: [], lastBreathTime };
  }
  if (lastBreathTime > 0 && peak.t - lastBreathTime < MIN_PEAK_GAP_MS) {
    return { breathTimes: [], lastBreathTime };
  }
  if (!trough || peak.value - trough.value < minDepth) {
    return { breathTimes: [], lastBreathTime };
  }
  return { breathTimes: [peak.t], lastBreathTime: peak.t };
}

/** @deprecated Peak-trough-peak counting — use selectBreathPeaksFromExtrema instead. */
export function breathsFromPeakTroughPeak(
  extrema: ConfirmedExtremum[],
  minDepth: number,
  _lastBreathTime: number,
  _countedWaves: string[],
): WaveBreathResult {
  void _lastBreathTime;
  void _countedWaves;
  const peakTimes = selectBreathPeaksFromExtrema(extrema, minDepth);
  const last = peakTimes[peakTimes.length - 1] ?? 0;
  return { breathTimes: peakTimes, lastBreathTime: last };
}

function isPeak5(values: number[]): boolean {
  const v = values[2]!;
  return v >= values[0]! && v >= values[1]! && v > values[3]! && v > values[4]!;
}

function isTrough5(values: number[]): boolean {
  const v = values[2]!;
  return v <= values[0]! && v <= values[1]! && v < values[3]! && v < values[4]!;
}

function pushExtremum(
  extrema: ConfirmedExtremum[],
  extremum: ConfirmedExtremum,
): ConfirmedExtremum[] {
  const next = extrema.length >= EXTREMA_HISTORY_CAP ? extrema.slice(1) : extrema.slice();
  const last = next[next.length - 1];
  if (last && last.kind === extremum.kind) {
    if (extremum.kind === 'peak' && extremum.value >= last.value) {
      next[next.length - 1] = extremum;
      return next;
    }
    if (extremum.kind === 'trough' && extremum.value <= last.value) {
      next[next.length - 1] = extremum;
      return next;
    }
    return next;
  }
  next.push(extremum);
  return next;
}

export function processAxisSample(
  state: StreamingBreathDetectorState,
  raw: Vec3,
  t: number,
  options: ProcessAxisOptions = {},
): {
  state: StreamingBreathDetectorState;
  signal: number;
  breathDetected: boolean;
  breathTime: number | null;
} {
  const baseline = options.freezeAxisBaseline
    ? state.baseline
    : updateAxisBaseline(state.baseline, raw);

  const combined = combinedAxisSignal(raw, baseline);
  const smoothed = lowPassSmooth(state.smoothed, combined);
  const signalBaseline =
    state.signalBaseline * (1 - SIGNAL_BASELINE_ALPHA) + smoothed * SIGNAL_BASELINE_ALPHA;
  const acComponent = smoothed - signalBaseline;
  const signal = amplifyBreathingSignal(acComponent);

  const recentSignals = pushRecent(state.recentSignals, signal);
  const minDepth = adaptiveWaveDepth(recentSignals);

  const lag5 = [...state.lag5, signal].slice(-5);
  const lag5T = [...state.lag5T, t].slice(-5);

  let extrema = state.extrema;
  let countedWaves = state.countedWaves;
  let lastBreathTime = state.lastBreathTime;
  const breathTimes = state.breathTimes;
  let breathDetected = false;
  let breathTime: number | null = null;

  if (lag5.length === 5) {
    const centerT = lag5T[2]!;
    let confirmed: ConfirmedExtremum | null = null;

    if (isPeak5(lag5)) {
      confirmed = { kind: 'peak', value: lag5[2]!, t: centerT };
    } else if (isTrough5(lag5)) {
      confirmed = { kind: 'trough', value: lag5[2]!, t: centerT };
    }

    if (confirmed) {
      extrema = pushExtremum(extrema, confirmed);

      const selected = selectBreathPeaksFromExtrema(extrema, minDepth);
      const latest = selected[selected.length - 1];
      if (latest != null && latest > lastBreathTime) {
        breathTimes.push(latest);
        lastBreathTime = latest;
        breathDetected = true;
        breathTime = latest;
      }
    }
  }

  return {
    state: {
      baseline,
      smoothed,
      signalBaseline,
      recentSignals,
      lag5,
      lag5T,
      extrema,
      countedWaves,
      lastBreathTime,
      breathTimes,
    },
    signal,
    breathDetected,
    breathTime,
  };
}

export type WaveformAnalysis = {
  peakCount: number;
  peakTimes: number[];
};

function highPassWaveform(samples: WaveformPoint[], windowMs = 2500): WaveformPoint[] {
  if (samples.length === 0) return samples;

  return samples.map((sample, index) => {
    const windowStart = sample.t - windowMs;
    let sum = 0;
    let count = 0;
    for (let i = index; i >= 0; i -= 1) {
      const s = samples[i]!;
      if (s.t < windowStart) break;
      sum += s.z;
      count += 1;
    }
    const localMean = count > 0 ? sum / count : sample.z;
    return { ...sample, z: sample.z - localMean };
  });
}

function findExtrema5(samples: WaveformPoint[]): ConfirmedExtremum[] {
  const extrema: ConfirmedExtremum[] = [];

  for (let i = 2; i < samples.length - 2; i += 1) {
    const window = [
      samples[i - 2]!.z,
      samples[i - 1]!.z,
      samples[i]!.z,
      samples[i + 1]!.z,
      samples[i + 2]!.z,
    ];

    if (isPeak5(window)) {
      extrema.push({ kind: 'peak', value: samples[i]!.z, t: samples[i]!.t });
    } else if (isTrough5(window)) {
      extrema.push({ kind: 'trough', value: samples[i]!.z, t: samples[i]!.t });
    }
  }

  const merged: ConfirmedExtremum[] = [];
  for (const e of extrema) {
    const last = merged[merged.length - 1];
    if (!last || last.kind !== e.kind) {
      merged.push(e);
      continue;
    }
    if (e.kind === 'peak' && e.value >= last.value) {
      merged[merged.length - 1] = e;
    } else if (e.kind === 'trough' && e.value <= last.value) {
      merged[merged.length - 1] = e;
    }
  }

  return merged;
}

/**
 * Offline graph analysis: count validated peaks — each peak is one breath.
 */
export function countPeaksFromWaveform(samples: WaveformPoint[]): WaveformAnalysis {
  if (samples.length < 5) {
    return { peakCount: 0, peakTimes: [] };
  }

  const filtered = highPassWaveform(samples);
  const minDepth = adaptiveWaveDepth(filtered.map((s) => s.z));
  const extrema = findExtrema5(filtered);
  const peakTimes = selectBreathPeaksFromExtrema(extrema, minDepth);

  return { peakCount: peakTimes.length, peakTimes };
}

/** @deprecated alias — peaks only */
export function countBreathsFromWaveform(samples: WaveformPoint[]): WaveformAnalysis & {
  breathCount: number;
  breathTimes: number[];
} {
  const analysis = countPeaksFromWaveform(samples);
  return {
    ...analysis,
    breathCount: analysis.peakCount,
    breathTimes: analysis.peakTimes,
  };
}

export function pushWaveformSample(
  buffer: WaveformPoint[],
  sample: WaveformPoint,
  cutoffMs: number,
): void {
  buffer.push(sample);
  while (buffer.length > 0 && buffer[0]!.t < cutoffMs) {
    buffer.shift();
  }
}

export function breathsInWindow(breathTimes: number[], nowMs: number, windowMs: number): number {
  const cutoff = nowMs - windowMs;
  let count = 0;
  for (let i = breathTimes.length - 1; i >= 0; i -= 1) {
    if (breathTimes[i]! < cutoff) break;
    count += 1;
  }
  return count;
}

export function resetStreamingBreathDetector(initial: Vec3): StreamingBreathDetectorState {
  return createStreamingBreathDetector(initial);
}
