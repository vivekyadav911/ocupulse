import { collection, doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { deleteOutboxIds, getAllOutbox, insertOutbox, resultsDao } from './db/sqlite';

export type LeaderRow = {
  id: string;
  teamName: string;
  score: number;
  activityType: string;
  lat?: number;
  lng?: number;
  peakDb?: number;
  avgDb?: number;
};

export type LeaderboardFilter = string | 'all';

export function subscribeLeaderboard(
  activityType: LeaderboardFilter,
  onRows: (rows: LeaderRow[]) => void,
): Unsubscribe {
  const db = getFirestoreDb();
  if (!db) {
    onRows([]);
    return () => {};
  }
  const col = collection(db, 'scores');
  return onSnapshot(
    col,
    (snap) => {
      const rows = snap.docs
        .map((d) => {
          const x = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            teamName: String(x.teamName ?? ''),
            score: Number(x.score ?? 0),
            activityType: String(x.activityType ?? activityType),
            lat: x.lat != null ? Number(x.lat) : undefined,
            lng: x.lng != null ? Number(x.lng) : undefined,
            peakDb: x.peakDb != null ? Number(x.peakDb) : undefined,
            avgDb: x.avgDb != null ? Number(x.avgDb) : undefined,
          };
        })
        .filter((r) => activityType === 'all' || r.activityType === activityType)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);
      onRows(rows);
    },
    () => onRows([]),
  );
}

export async function flushOutboxRow(
  path: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const id = path.replace(/^scores\//, '');
  await setDoc(doc(db, 'scores', id), payload, { merge: true });
}

/** Flush all pending SQLite outbox rows to Firestore (offline-first). */
export async function syncOutbox(): Promise<void> {
  const rows = await getAllOutbox();
  if (!rows.length) return;
  const db = getFirestoreDb();
  if (!db) return;
  const done: number[] = [];
  for (const r of rows) {
    try {
      const payload = JSON.parse(r.payload) as Record<string, unknown>;
      await flushOutboxRow(r.path, payload);
      done.push(r.id);
    } catch (e) {
      console.warn('[STEMM Lab] syncOutbox failed for row', r.id, e);
    }
  }
  await deleteOutboxIds(done);
}

export async function writeSessionOptimistic(input: {
  activityType: string;
  teamName: string;
  score: number;
  payload: Record<string, unknown>;
}): Promise<string> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  await resultsDao.insert({
    id,
    sessionId: id,
    activityType: input.activityType,
    score: input.score,
    dataJson: JSON.stringify(input.payload),
    synced: 0,
  });
  const docPayload = {
    teamName: input.teamName,
    activityType: input.activityType,
    score: input.score,
    ...input.payload,
    updatedAt: Date.now(),
  };
  await insertOutbox(`scores/${id}`, docPayload);
  void syncOutbox();
  return id;
}
