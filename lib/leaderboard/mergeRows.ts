import type { LeaderRow } from '../../services/firestore';

/** Merge remote + local rows; remote wins on id conflict. Sorting is applied in rankRows. */
export function mergeLeaderRows(local: LeaderRow[], remote: LeaderRow[]): LeaderRow[] {
  const byId = new Map<string, LeaderRow>();
  for (const row of local) byId.set(row.id, row);
  for (const row of remote) byId.set(row.id, { ...byId.get(row.id), ...row });
  return [...byId.values()];
}
