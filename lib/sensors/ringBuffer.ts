export const RING_WINDOW_MS = 5000;

export type TimestampedSample = {
  t: number;
  magnitude: number;
};

export function trimByWindow<T extends { t: number }>(
  samples: T[],
  now: number,
  windowMs = RING_WINDOW_MS,
): T[] {
  const cutoff = now - windowMs;
  let start = 0;
  while (start < samples.length && samples[start]!.t < cutoff) {
    start += 1;
  }
  if (start === 0) return samples;
  return samples.slice(start);
}

export function pushRingSample<T extends { t: number }>(
  samples: T[],
  sample: T,
  now: number,
  windowMs = RING_WINDOW_MS,
): T[] {
  const trimmed = trimByWindow(samples, now, windowMs);
  trimmed.push(sample);
  return trimmed;
}

export function magnitudesFrom<T extends { magnitude: number }>(samples: T[]): number[] {
  return samples.map((s) => s.magnitude);
}

export function computeStats(values: number[]): { mean: number; peak: number; rms: number } {
  if (!values.length) {
    return { mean: 0, peak: 0, rms: 0 };
  }
  let sum = 0;
  let peak = 0;
  let sumSq = 0;
  for (const v of values) {
    sum += v;
    sumSq += v * v;
    if (v > peak) peak = v;
  }
  const mean = sum / values.length;
  const rms = Math.sqrt(sumSq / values.length);
  return { mean, peak, rms };
}

/** Sample rate from timestamps in the buffer (Hz). */
export function estimateHz(timestamps: number[]): number {
  if (timestamps.length < 2) return 0;
  const first = timestamps[0]!;
  const last = timestamps[timestamps.length - 1]!;
  const spanMs = last - first;
  if (spanMs <= 0) return 0;
  return ((timestamps.length - 1) * 1000) / spanMs;
}

export function targetHzFromIntervalMs(intervalMs: number): number {
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) return 0;
  return 1000 / intervalMs;
}
