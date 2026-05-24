import {
  amplifyBreathingSignal,
  lowPassSmooth,
  SENSITIVITY_GAIN,
  type WaveformPoint,
} from './breathingSignal';

export type Vec3 = { x: number; y: number; z: number };

/** Axis weights — Z leads for chest placement; X/Y capture roll and lateral chest motion. */
export const AXIS_WEIGHTS = { x: 0.35, y: 0.35, z: 0.55 } as const;

const BASELINE_ALPHA = 0.002;
const MIN_PROMINENCE_G = 0.035;
const MIN_HALF_CYCLE_MS = 350;
const MAX_HALF_CYCLE_MS = 4500;
const MIN_BREATH_GAP_MS = 400;

export type AxisBaseline = Vec3;

export type BreathCyclePhase = 'idle' | 'afterTrough';

export type StreamingBreathDetectorState = {
  baseline: AxisBaseline;
  smoothed: number;
  /** Delay line for 3-point extrema (oldest → newest). */
  lag: [number, number, number];
  lagT: [number, number, number];
  sampleCount: number;
  phase: BreathCyclePhase;
  lastTroughValue: number;
  lastTroughTime: number;
  lastBreathTime: number;
  breathTimes: number[];
};

export function createStreamingBreathDetector(initial: Vec3): StreamingBreathDetectorState {
  return {
    baseline: { ...initial },
    smoothed: 0,
    lag: [0, 0, 0],
    lagT: [0, 0, 0],
    sampleCount: 0,
    phase: 'idle',
    lastTroughValue: 0,
    lastTroughTime: 0,
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

/** Weighted 3-axis chest motion magnitude after baseline removal. */
export function combinedAxisSignal(raw: Vec3, baseline: AxisBaseline): number {
  const dx = raw.x - baseline.x;
  const dy = raw.y - baseline.y;
  const dz = raw.z - baseline.z;
  const { x: wx, y: wy, z: wz } = AXIS_WEIGHTS;
  return Math.sqrt(wx * dx * dx + wy * dy * dy + wz * dz * dz);
}

export function processAxisSample(
  state: StreamingBreathDetectorState,
  raw: Vec3,
  t: number,
): {
  state: StreamingBreathDetectorState;
  signal: number;
  breathDetected: boolean;
  breathTime: number | null;
} {
  const baseline = updateAxisBaseline(state.baseline, raw);
  const combined = combinedAxisSignal(raw, baseline);
  const smoothed = lowPassSmooth(state.smoothed, combined);
  const signal = amplifyBreathingSignal(smoothed);

  const lag: [number, number, number] = [state.lag[1], state.lag[2], signal];
  const lagT: [number, number, number] = [state.lagT[1], state.lagT[2], t];
  const sampleCount = state.sampleCount + 1;
  const lagReady = sampleCount >= 3;

  let phase = state.phase;
  let lastTroughValue = state.lastTroughValue;
  let lastTroughTime = state.lastTroughTime;
  let lastBreathTime = state.lastBreathTime;
  const breathTimes = state.breathTimes;
  let breathDetected = false;
  let breathTime: number | null = null;

  if (lagReady) {
    const [v0, v1, v2] = lag;
    const [, t1] = lagT;
    const minProminence = MIN_PROMINENCE_G * SENSITIVITY_GAIN;

    const isTrough = v1 <= v0 && v1 <= v2;
    const isPeak = v1 >= v0 && v1 >= v2;

    if (isTrough) {
      phase = 'afterTrough';
      lastTroughValue = v1;
      lastTroughTime = t1;
    } else if (isPeak && phase === 'afterTrough') {
      const prominence = v1 - lastTroughValue;
      const halfCycleMs = t1 - lastTroughTime;
      const gapMs = t1 - lastBreathTime;

      if (
        prominence >= minProminence &&
        halfCycleMs >= MIN_HALF_CYCLE_MS &&
        halfCycleMs <= MAX_HALF_CYCLE_MS &&
        (lastBreathTime === 0 || gapMs >= MIN_BREATH_GAP_MS)
      ) {
        breathDetected = true;
        breathTime = t1;
        lastBreathTime = t1;
        breathTimes.push(t1);
        phase = 'idle';
      }
    }
  }

  return {
    state: {
      baseline,
      smoothed,
      lag,
      lagT,
      sampleCount,
      phase,
      lastTroughValue,
      lastTroughTime,
      lastBreathTime,
      breathTimes,
    },
    signal,
    breathDetected,
    breathTime,
  };
}

export type WaveformAnalysis = {
  breathCount: number;
  breathTimes: number[];
};

/**
 * Offline pass over recorded graph — trough → peak = 1 breath.
 * Used to finalize BPM from the full 30 s buffer.
 */
export function countBreathsFromWaveform(samples: WaveformPoint[]): WaveformAnalysis {
  if (samples.length < 5) {
    return { breathCount: 0, breathTimes: [] };
  }

  const breathTimes: number[] = [];
  let phase: BreathCyclePhase = 'idle';
  let lastTroughValue = 0;
  let lastTroughTime = 0;
  let lastBreathTime = 0;
  const minProminence = MIN_PROMINENCE_G * SENSITIVITY_GAIN;

  for (let i = 1; i < samples.length - 1; i += 1) {
    const prev = samples[i - 1]!;
    const curr = samples[i]!;
    const next = samples[i + 1]!;

    const isTrough = curr.z <= prev.z && curr.z <= next.z;
    const isPeak = curr.z >= prev.z && curr.z >= next.z;

    if (isTrough) {
      phase = 'afterTrough';
      lastTroughValue = curr.z;
      lastTroughTime = curr.t;
    } else if (isPeak && phase === 'afterTrough') {
      const prominence = curr.z - lastTroughValue;
      const halfCycleMs = curr.t - lastTroughTime;
      const gapMs = curr.t - lastBreathTime;

      if (
        prominence >= minProminence &&
        halfCycleMs >= MIN_HALF_CYCLE_MS &&
        halfCycleMs <= MAX_HALF_CYCLE_MS &&
        (lastBreathTime === 0 || gapMs >= MIN_BREATH_GAP_MS)
      ) {
        breathTimes.push(curr.t);
        lastBreathTime = curr.t;
        phase = 'idle';
      }
    }
  }

  return { breathCount: breathTimes.length, breathTimes };
}

/** In-place push with time-based trim — avoids array copies each sample. */
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
