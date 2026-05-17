import type { SoundSamplePayload } from './types';

export function parseSoundPayload(dataJson: string | null): SoundSamplePayload | null {
  if (!dataJson) return null;
  try {
    const raw = JSON.parse(dataJson) as Record<string, unknown>;
    const peakDb = Number(raw.peakDb);
    const avgDb = Number(raw.avgDb);
    const lat = Number(raw.lat);
    const lng = Number(raw.lng);
    if (!Number.isFinite(peakDb) || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      peakDb,
      avgDb: Number.isFinite(avgDb) ? avgDb : peakDb,
      lat,
      lng,
      address: String(raw.address ?? ''),
    };
  } catch {
    return null;
  }
}
