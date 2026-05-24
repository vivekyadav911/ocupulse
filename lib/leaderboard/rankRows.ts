import type { LeaderboardFilter, LeaderRow } from '../../services/firestore';
import { normalizedScoreForAll } from './normalizeScore';

/** Sort key for ranking — higher key = better rank (position 1). */
export function leaderboardSortKey(row: LeaderRow, filter: LeaderboardFilter): number {
  if (filter === 'all') return normalizedScoreForAll(row);
  if (filter === 'parachute') return -row.score;
  return row.score;
}

export function compareLeaderRows(a: LeaderRow, b: LeaderRow, filter: LeaderboardFilter): number {
  const keyA = leaderboardSortKey(a, filter);
  const keyB = leaderboardSortKey(b, filter);
  if (keyB !== keyA) return keyB - keyA;
  return (a.submittedAt ?? 0) - (b.submittedAt ?? 0);
}

const LEADERBOARD_LIMIT = 50;

/** Filter, sort, and shape rows for the active leaderboard tab. */
export function prepareLeaderboardRows(rows: LeaderRow[], filter: LeaderboardFilter): LeaderRow[] {
  const filtered = filter === 'all' ? rows : rows.filter((r) => r.activityType === filter);

  const sorted = [...filtered].sort((a, b) => compareLeaderRows(a, b, filter));

  if (filter === 'all') {
    return sorted.slice(0, LEADERBOARD_LIMIT).map((row) => ({
      ...row,
      scoreLabel: `${normalizedScoreForAll(row)}`,
    }));
  }

  return sorted.slice(0, LEADERBOARD_LIMIT);
}
