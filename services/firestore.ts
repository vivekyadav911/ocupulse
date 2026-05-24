import { doc, setDoc, type DocumentReference } from 'firebase/firestore';
import { getCurrentUser } from './auth';
import {
  deleteOutboxIds,
  getAllOutbox,
  insertOutbox,
  markResultSynced,
  resultsDao,
  sessionsDao,
} from './db/sqlite';
import { getFirestoreDb } from './firebase';

export type LeaderRow = {
  id: string;
  teamName: string;
  score: number;
  activityType: string;
  submittedAt?: number;
  scoreLabel?: string;
  detail?: string;
  lat?: number;
  lng?: number;
  peakDb?: number;
  avgDb?: number;
  address?: string;
};

export type LeaderboardFilter = string | 'all';

function docRefForPath(
  db: NonNullable<ReturnType<typeof getFirestoreDb>>,
  path: string,
): DocumentReference {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 2) {
    return doc(db, parts[0]!, parts[1]!);
  }
  if (parts.length === 4) {
    return doc(db, parts[0]!, parts[1]!, parts[2]!, parts[3]!);
  }
  throw new Error(`Unsupported outbox path: ${path}`);
}

export async function flushOutboxRow(
  path: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = docRefForPath(db, path);
  await setDoc(ref, payload, { merge: true });

  if (path.startsWith('scores/')) {
    const resultId = path.replace(/^scores\//, '');
    await markResultSynced(resultId);
  }
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
      console.warn('[Ocupulse] syncOutbox failed for row', r.id, e);
    }
  }
  await deleteOutboxIds(done);
}

export async function writeSessionOptimistic(input: {
  activityType: string;
  teamName: string;
  teamId?: string | null;
  studentId?: string | null;
  userId?: string | null;
  score: number;
  payload: Record<string, unknown>;
  mediaUrls?: string[];
}): Promise<string> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const user = getCurrentUser();
  const userId = input.userId ?? user?.uid ?? null;
  const sessionStart = Date.now();
  const teamName = input.teamName.trim() || 'Demo Team';
  const submittedAt = Date.now();
  const storedPayload = {
    ...input.payload,
    teamName,
    activityType: input.activityType,
    score: input.score,
    submittedAt,
  };

  await sessionsDao.insert({
    id,
    teamId: input.teamId ?? null,
    activityType: input.activityType,
    startTime: sessionStart,
    studentId: input.studentId ?? null,
    createdBy: userId,
    synced: 0,
  });

  await resultsDao.insert({
    id,
    sessionId: id,
    activityType: input.activityType,
    score: input.score,
    dataJson: JSON.stringify(storedPayload),
    synced: 0,
    teamId: input.teamId ?? null,
    studentId: input.studentId ?? null,
    userId,
    mediaUrlsJson: input.mediaUrls?.length ? JSON.stringify(input.mediaUrls) : null,
  });

  const docPayload = {
    teamName,
    teamId: input.teamId ?? null,
    studentId: input.studentId ?? null,
    userId,
    sessionId: id,
    activityType: input.activityType,
    score: input.score,
    mediaUrls: input.mediaUrls ?? [],
    ...storedPayload,
    updatedAt: submittedAt,
  };

  await insertOutbox(`scores/${id}`, docPayload);
  await insertOutbox(`sessions/${id}`, {
    teamId: input.teamId ?? null,
    studentId: input.studentId ?? null,
    activityType: input.activityType,
    startTime: sessionStart,
    createdBy: userId,
    updatedAt: Date.now(),
  });

  void syncOutbox();
  return id;
}

/** Attach on-device media path to an existing session/score (local only, no cloud storage). */
export async function attachLocalMedia(sessionId: string, localUri: string): Promise<void> {
  const existing = await resultsDao.findById(sessionId);
  if (existing) {
    const data = existing.dataJson
      ? (JSON.parse(existing.dataJson) as Record<string, unknown>)
      : {};
    data.localMediaUri = localUri;
    await resultsDao.update({
      ...existing,
      dataJson: JSON.stringify(data),
      mediaUrlsJson: JSON.stringify([localUri]),
    });
  }
  await insertOutbox(`scores/${sessionId}`, {
    mediaUrls: [localUri],
    localMediaUri: localUri,
    updatedAt: Date.now(),
  });
  void syncOutbox();
}
