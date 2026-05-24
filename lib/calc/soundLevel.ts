import { dbBarColor, markerColorForPeakDb } from '../sound/markerColor';

export const SPL_MIN = 0;
export const SPL_MAX = 140;
export const SPL_DISPLAY_MAX = 140;

export type PollutionTier = 'quiet' | 'moderate' | 'loud';

export type SoundReferenceRow = {
  id: string;
  minDb: number;
  maxDb: number;
  source: string;
  risk: string;
};

export const SOUND_REFERENCE_ROWS: SoundReferenceRow[] = [
  { id: 'whisper', minDb: 0, maxDb: 30, source: 'Whisper / library', risk: 'No risk' },
  { id: 'conversation', minDb: 30, maxDb: 60, source: 'Normal conversation', risk: 'Safe' },
  { id: 'traffic', minDb: 60, maxDb: 85, source: 'Busy traffic', risk: 'Generally safe' },
  { id: 'mower', minDb: 85, maxDb: 90, source: 'Lawn mower', risk: 'Damage after long exposure' },
  {
    id: 'motorbike',
    minDb: 90,
    maxDb: 100,
    source: 'Motorbike',
    risk: 'Damage after short exposure',
  },
  {
    id: 'nightclub',
    minDb: 100,
    maxDb: 110,
    source: 'Nightclub',
    risk: 'Serious damage in minutes',
  },
  { id: 'siren', minDb: 110, maxDb: 120, source: 'Siren', risk: 'Painful; immediate damage' },
  {
    id: 'jet',
    minDb: 120,
    maxDb: 140,
    source: 'Jet engine',
    risk: 'Immediate severe damage',
  },
  {
    id: 'explosion',
    minDb: 140,
    maxDb: Infinity,
    source: 'Explosion',
    risk: 'Instant permanent damage',
  },
];

export type SoundPrediction = 'louder' | 'softer';

/** Convert expo-av metering (dBFS) to approximate SPL for classroom readouts. */
export function meteringToApproxSpl(dbfs: number): number {
  if (!Number.isFinite(dbfs)) return SPL_MIN;
  return Math.min(SPL_MAX, Math.max(SPL_MIN, dbfs + 90));
}

export function aggregateSoundLevels(samples: number[]): { peakDb: number; avgDb: number } {
  if (samples.length === 0) return { peakDb: 0, avgDb: 0 };
  let sum = 0;
  let peak = samples[0]!;
  for (const v of samples) {
    sum += v;
    if (v > peak) peak = v;
  }
  return { peakDb: peak, avgDb: Math.round(sum / samples.length) };
}

export function pollutionTierForPeakDb(peakDb: number): PollutionTier {
  if (peakDb > 85) return 'loud';
  if (peakDb >= 60) return 'moderate';
  return 'quiet';
}

export function pollutionTierLabel(tier: PollutionTier): string {
  switch (tier) {
    case 'quiet':
      return 'Quiet';
    case 'moderate':
      return 'Moderate';
    case 'loud':
      return 'Loud';
  }
}

/** Reference table row matching the current live dB level. */
export function referenceRowForDb(db: number): SoundReferenceRow {
  const clamped = Math.max(SPL_MIN, Math.min(SPL_MAX, db));
  const row =
    SOUND_REFERENCE_ROWS.find((r) => clamped >= r.minDb && clamped < r.maxDb) ??
    SOUND_REFERENCE_ROWS[SOUND_REFERENCE_ROWS.length - 1]!;
  return row;
}

export function isPredictionCorrect(
  prediction: SoundPrediction | null,
  currentDb: number,
  previousDb: number | null,
): boolean | null {
  if (prediction == null || previousDb == null) return null;
  if (prediction === 'louder') return currentDb > previousDb;
  return currentDb < previousDb;
}

export function predictionLabel(prediction: SoundPrediction | null): string {
  if (prediction === 'louder') return 'Louder than previous';
  if (prediction === 'softer') return 'Softer than previous';
  return '—';
}

export function formatPredictionCorrect(correct: boolean | null): string {
  if (correct === null) return 'N/A';
  return correct ? 'Yes' : 'No';
}

export { dbBarColor, markerColorForPeakDb };
