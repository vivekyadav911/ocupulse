import { collection, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { formatLeaderboardDisplay } from '../lib/leaderboard/formatLeaderRow';
import { mergeLeaderRows } from '../lib/leaderboard/mergeRows';
import type { LeaderboardFilter, LeaderRow } from './firestore';
import { getAllOutbox, resultsDao } from './db/sqlite';
import { getFirestoreDb } from './firebase';

export type { LeaderboardFilter, LeaderRow } from './firestore';

function payloadFromUnknown(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

export function leaderRowFromStored(
  id: string,
  activityType: string,
  score: number,
  payload: Record<string, unknown>,
): LeaderRow {
  const teamName = String(payload.teamName ?? 'Demo Team');
  const submittedAt = Number(payload.submittedAt ?? payload.updatedAt ?? 0);
  const display = formatLeaderboardDisplay(activityType, score, payload);
  return {
    id,
    teamName,
    score,
    activityType,
    submittedAt,
    scoreLabel: display.scoreText,
    detail: display.detail,
    lat: payload.lat != null ? Number(payload.lat) : undefined,
    lng: payload.lng != null ? Number(payload.lng) : undefined,
    peakDb: payload.peakDb != null ? Number(payload.peakDb) : undefined,
    avgDb: payload.avgDb != null ? Number(payload.avgDb) : undefined,
  };
}

export async function loadLocalLeaderRows(): Promise<LeaderRow[]> {
  const [results, outbox] = await Promise.all([resultsDao.findAll(), getAllOutbox()]);

  const outboxPayloadById = new Map<string, Record<string, unknown>>();
  for (const row of outbox) {
    const id = row.path.replace(/^scores\//, '');
    try {
      outboxPayloadById.set(id, payloadFromUnknown(JSON.parse(row.payload)));
    } catch {
      /* skip bad outbox row */
    }
  }

  const rows: LeaderRow[] = [];
  for (const r of results) {
    if (!r.activityType || r.score == null) continue;
    let payload = outboxPayloadById.get(r.id) ?? {};
    if (!Object.keys(payload).length && r.dataJson) {
      try {
        payload = payloadFromUnknown(JSON.parse(r.dataJson));
      } catch {
        payload = {};
      }
    }
    rows.push(leaderRowFromStored(r.id, r.activityType, r.score, payload));
  }
  return rows;
}

function subscribeFirestoreAll(onRows: (rows: LeaderRow[]) => void): Unsubscribe {
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
          const x = payloadFromUnknown(d.data());
          const activityType = String(x.activityType ?? '');
          const score = Number(x.score ?? 0);
          return leaderRowFromStored(d.id, activityType, score, x);
        })
        .filter((r) => r.activityType.length > 0);
      onRows(rows);
    },
    () => onRows([]),
  );
}

export type LeaderboardSubscription = {
  unsubscribe: () => void;
  /** Reload scores saved on this device (call after saving an experiment). */
  refresh: () => void;
};

/** Live leaderboard: SQLite + outbox (offline) merged with Firestore when online. */
export function subscribeLeaderboard(
  activityType: LeaderboardFilter,
  onRows: (rows: LeaderRow[]) => void,
): LeaderboardSubscription {
  let localRows: LeaderRow[] = [];
  let remoteRows: LeaderRow[] = [];

  const publish = () => {
    const merged = mergeLeaderRows(localRows, remoteRows);
    const filtered =
      activityType === 'all' ? merged : merged.filter((r) => r.activityType === activityType);
    onRows(filtered.slice(0, 50));
  };

  const refreshLocal = () => {
    void loadLocalLeaderRows().then((rows) => {
      localRows = rows;
      publish();
    });
  };

  refreshLocal();

  const unsubRemote = subscribeFirestoreAll((rows) => {
    remoteRows = rows;
    publish();
  });

  return {
    unsubscribe: () => {
      unsubRemote();
    },
    refresh: refreshLocal,
  };
}
