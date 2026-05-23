import type { ParachuteSubmitPayload } from '../lib/parachute/runSummary';

const API_BASE = process.env.EXPO_PUBLIC_STEMM_API_URL ?? 'https://api.stemm-lab.placeholder';

export type ParachuteLeaderboardEntry = {
  teamName: string;
  finalVelocityMps: number;
};

export async function submitParachuteActivity(payload: ParachuteSubmitPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/api/activities/1/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Upload failed (${res.status})`);
  }
}

export async function fetchParachuteLeaderboard(): Promise<ParachuteLeaderboardEntry[]> {
  const res = await fetch(`${API_BASE}/api/leaderboard?activity=1`);
  if (!res.ok) {
    throw new Error(`Leaderboard fetch failed (${res.status})`);
  }
  const data = (await res.json()) as unknown;
  const rows = normalizeLeaderboardRows(data);
  return rows
    .filter((r) => Number.isFinite(r.finalVelocityMps))
    .sort((a, b) => a.finalVelocityMps - b.finalVelocityMps)
    .slice(0, 5);
}

function normalizeLeaderboardRows(data: unknown): ParachuteLeaderboardEntry[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      teamName: String(row.teamName ?? row.team ?? ''),
      finalVelocityMps: Number(row.finalVelocityMps ?? row.score ?? row.velocity ?? 0),
    };
  });
}

export function getApiBase(): string {
  return API_BASE;
}
