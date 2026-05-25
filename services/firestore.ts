import { doc, setDoc, type DocumentReference } from 'firebase/firestore';
import { getCurrentUser, getUserProfile } from './auth';
import { getTeamTeacherId } from './profiles';
import { useSessionStore } from '../store/sessionStore';
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
  studentId?: string;
  studentFirstName?: string;
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

function isPermissionDenied(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    String((error as { code: string }).code).includes('permission-denied')
  );
}

/** Flush all pending SQLite outbox rows to Firestore (offline-first). */
export async function syncOutbox(): Promise<void> {
  const rows = await getAllOutbox();
  if (!rows.length) return;
  const db = getFirestoreDb();
  if (!db) return;

  const user = getCurrentUser();
  const profile = user ? await getUserProfile(user.uid) : null;
  const uid = user?.uid ?? null;
  const canSyncScores =
    (profile?.role === 'student' && Boolean(uid)) || profile?.role === 'teacher';

  const synced: number[] = [];
  const dropped: number[] = [];

  for (const r of rows) {
    const isScoreOrSession = r.path.startsWith('scores/') || r.path.startsWith('sessions/');

    if (isScoreOrSession && !canSyncScores) {
      dropped.push(r.id);
      continue;
    }

    try {
      const payload = JSON.parse(r.payload) as Record<string, unknown>;
      if (isScoreOrSession && uid) {
        const personal =
          payload.personalPractice === true ||
          (payload.teamId == null && profile?.role === 'teacher');
        if (profile?.role === 'teacher' && !personal) {
          if (r.path.startsWith('scores/')) payload.teacherId = uid;
          if (r.path.startsWith('sessions/')) {
            payload.createdBy = uid;
            payload.teacherId = uid;
          }
        } else {
          if (r.path.startsWith('scores/')) payload.userId = uid;
          if (r.path.startsWith('sessions/')) payload.createdBy = uid;
        }
      }
      await flushOutboxRow(r.path, payload);
      synced.push(r.id);
    } catch (e) {
      if (isPermissionDenied(e)) {
        dropped.push(r.id);
      } else {
        console.warn('[Ocupulse] syncOutbox failed for row', r.id, e);
      }
    }
  }

  await deleteOutboxIds([...synced, ...dropped]);
}

/** Remove orphaned score/session rows that cannot sync (e.g. from old sessions). */
export async function clearStaleOutboxRows(): Promise<void> {
  const rows = await getAllOutbox();
  if (!rows.length) return;

  const user = getCurrentUser();
  const profile = user ? await getUserProfile(user.uid) : null;
  const canSyncScores =
    profile?.role === 'teacher' || (profile?.role === 'student' && Boolean(user?.uid));

  const stale = rows
    .filter(
      (r) =>
        r.path.startsWith('scores/') ||
        r.path.startsWith('sessions/') ||
        (!user && (r.path.startsWith('teams/') || r.path.includes('/students/'))),
    )
    .filter((r) => {
      if (r.path.startsWith('scores/') || r.path.startsWith('sessions/')) {
        return !canSyncScores;
      }
      return !user;
    })
    .map((r) => r.id);

  if (stale.length) await deleteOutboxIds(stale);
}

export async function writeSessionOptimistic(input: {
  activityType: string;
  teamName: string;
  teamId?: string | null;
  studentId?: string | null;
  studentFirstName?: string | null;
  userId?: string | null;
  score: number;
  payload: Record<string, unknown>;
  mediaUrls?: string[];
  /** Teacher running an activity for themselves — not attached to a managed team. */
  personalPractice?: boolean;
}): Promise<string> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const user = getCurrentUser();
  const userId = input.userId ?? user?.uid ?? null;
  const submittedAt = Date.now();
  const session = useSessionStore.getState();
  const personalPractice = input.personalPractice === true;
  const teamName = input.teamName.trim() || session.teamName.trim() || 'Demo Team';
  const teamId = personalPractice ? null : (input.teamId ?? session.teamId ?? null);
  const studentId = personalPractice ? null : (input.studentId ?? session.studentId ?? null);
  const studentFirstName =
    (input.studentFirstName ?? session.studentFirstName ?? '').trim() || undefined;
  const teacherId = personalPractice ? null : await getTeamTeacherId(teamId);

  await sessionsDao.insert({
    id,
    teamId,
    activityType: input.activityType,
    startTime: submittedAt,
    studentId,
    createdBy: userId,
    synced: 0,
  });

  const storedPayload = {
    ...input.payload,
    teamName,
    activityType: input.activityType,
    score: input.score,
    submittedAt,
    ...(studentFirstName ? { studentFirstName } : {}),
  };

  await resultsDao.insert({
    id,
    sessionId: id,
    activityType: input.activityType,
    score: input.score,
    dataJson: JSON.stringify(storedPayload),
    synced: 0,
    teamId,
    studentId,
    userId,
    mediaUrlsJson: input.mediaUrls?.length ? JSON.stringify(input.mediaUrls) : null,
  });

  const docPayload = {
    ...storedPayload,
    teamId,
    studentId,
    userId,
    sessionId: id,
    mediaUrls: input.mediaUrls ?? [],
    updatedAt: submittedAt,
    ...(personalPractice ? { personalPractice: true } : { teacherId }),
    ...(studentFirstName ? { studentFirstName } : {}),
  };

  await insertOutbox(`scores/${id}`, docPayload);
  await insertOutbox(`sessions/${id}`, {
    teamId,
    studentId,
    ...(personalPractice
      ? { personalPractice: true, createdBy: userId }
      : { teacherId, createdBy: userId }),
    activityType: input.activityType,
    startTime: submittedAt,
    updatedAt: submittedAt,
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
