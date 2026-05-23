import { markerColorForPeakDb } from '../sound/markerColor';

export const SPL_MIN = 20;
export const SPL_MAX = 120;

export type PollutionTier = 'quiet' | 'moderate' | 'loud';

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

export { markerColorForPeakDb };
