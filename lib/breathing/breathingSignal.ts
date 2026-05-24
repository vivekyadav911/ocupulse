export const BREATHING_SAMPLE_MS = 40; // 25 Hz
export const BREATHING_WINDOW_MS = 30_000;
export const WAVEFORM_DISPLAY_SEC = 10;

/** Amplify chest motion signal 3× so slow, shallow breaths register. */
export const SENSITIVITY_GAIN = 3;

export const LOW_PASS_PREV = 0.85;
export const LOW_PASS_RAW = 0.15;

export type WaveformPoint = { t: number; z: number; x?: number; y?: number };

export function lowPassSmooth(prevSmoothed: number, raw: number): number {
  return LOW_PASS_PREV * prevSmoothed + LOW_PASS_RAW * raw;
}

/** Scale filtered signal for peak detection and waveform display. */
export function amplifyBreathingSignal(smoothed: number): number {
  return smoothed * SENSITIVITY_GAIN;
}

export type BpmStatus = 'low' | 'normal' | 'elevated' | 'high';

export function bpmFromPeakCount(peakCount: number, windowMs: number): number {
  if (peakCount <= 0 || windowMs <= 0) return 0;
  const windowS = windowMs / 1000;
  const rate = (peakCount / windowS) * 60;
  return Math.round(rate * 10) / 10;
}

export function bpmStatus(bpm: number): BpmStatus {
  if (bpm < 12) return 'low';
  if (bpm <= 20) return 'normal';
  if (bpm <= 30) return 'elevated';
  return 'high';
}

export function bpmStatusLabel(status: BpmStatus): string {
  switch (status) {
    case 'low':
      return 'Low';
    case 'normal':
      return 'Normal';
    case 'elevated':
      return 'Elevated';
    case 'high':
      return 'High';
  }
}

export function bpmIncreasePercent(restBpm: number, peakBpm: number): number {
  if (restBpm <= 0) return 0;
  return Math.round(((peakBpm - restBpm) / restBpm) * 1000) / 10;
}

/** Downsample waveform to target Hz (default 5 Hz for upload). */
export function downsampleWaveform(
  samples: WaveformPoint[],
  sourceHz = 25,
  targetHz = 5,
): WaveformPoint[] {
  if (samples.length === 0 || targetHz >= sourceHz) return samples;
  const step = Math.max(1, Math.round(sourceHz / targetHz));
  const out: WaveformPoint[] = [];
  for (let i = 0; i < samples.length; i += step) {
    out.push(samples[i]!);
  }
  const last = samples[samples.length - 1];
  if (last && out[out.length - 1]?.t !== last.t) {
    out.push(last);
  }
  return out;
}

export function trimWaveformWindow(
  samples: WaveformPoint[],
  nowMs: number,
  windowSec: number,
): WaveformPoint[] {
  const cutoff = nowMs - windowSec * 1000;
  return samples.filter((s) => s.t >= cutoff);
}
