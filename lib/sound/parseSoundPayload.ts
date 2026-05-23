import type { PollutionTier } from '../calc/soundLevel';
import type { SoundSamplePayload } from './types';

function parsePollutionTier(raw: unknown): PollutionTier | undefined {
  if (raw === 'quiet' || raw === 'moderate' || raw === 'loud') return raw;
  return undefined;
}

export function parseSoundPayload(dataJson: string | null): SoundSamplePayload | null {
  if (!dataJson) return null;
  try {
    const raw = JSON.parse(dataJson) as Record<string, unknown>;
    const peakDb = Number(raw.peakDb);
    const avgDb = Number(raw.avgDb);
    const lat = Number(raw.lat);
    const lng = Number(raw.lng);
    if (!Number.isFinite(peakDb) || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const sampleDurationSec = Number(raw.sampleDurationSec);
    const sampleCount = Number(raw.sampleCount);
    return {
      peakDb,
      avgDb: Number.isFinite(avgDb) ? avgDb : peakDb,
      lat,
      lng,
      address: String(raw.address ?? ''),
      sampleDurationSec: Number.isFinite(sampleDurationSec) ? sampleDurationSec : undefined,
      sampleCount: Number.isFinite(sampleCount) ? sampleCount : undefined,
      pollutionTier: parsePollutionTier(raw.pollutionTier),
    };
  } catch {
    return null;
  }
}
