import { parseSoundPayload } from '../lib/sound/parseSoundPayload';
import type { SoundSample } from '../lib/sound/types';
import { resultsDao } from './db/sqlite';
import type { LeaderRow } from './firestore';

export function leaderRowToSoundSample(row: LeaderRow): SoundSample | null {
  if (row.lat == null || row.lng == null) return null;
  const peakDb = row.peakDb ?? row.score;
  return {
    id: row.id,
    peakDb,
    avgDb: row.avgDb ?? peakDb,
    lat: row.lat,
    lng: row.lng,
    address: row.address ?? '',
    teamName: row.teamName,
  };
}

export function experimentResultToSoundSample(
  id: string,
  dataJson: string | null,
  score: number | null,
): SoundSample | null {
  const payload = parseSoundPayload(dataJson);
  if (!payload) return null;
  return {
    id,
    peakDb: payload.peakDb,
    avgDb: payload.avgDb,
    lat: payload.lat,
    lng: payload.lng,
    address: payload.address,
  };
}

export async function loadSoundSamplesFromSqlite(): Promise<SoundSample[]> {
  const rows = await resultsDao.findAll();
  return rows
    .filter((r) => r.activityType === 'sound')
    .map((r) => experimentResultToSoundSample(r.id, r.dataJson, r.score))
    .filter((s): s is SoundSample => s != null);
}

export function mergeSoundSamples(local: SoundSample[], remote: SoundSample[]): SoundSample[] {
  const byId = new Map<string, SoundSample>();
  for (const s of local) byId.set(s.id, s);
  for (const s of remote) byId.set(s.id, { ...byId.get(s.id), ...s });
  return [...byId.values()].sort((a, b) => b.peakDb - a.peakDb);
}
