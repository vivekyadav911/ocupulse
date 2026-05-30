import { doc, getDoc, setDoc, type DocumentReference } from 'firebase/firestore';
import { isAnonymousExperiment } from '../lib/experiments/deleteAuth';
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

function ownerEmailFromPayload(payload: Record<string, unknown>): string | null {
  const raw = payload.ownerEmail;
  if (raw == null) return null;
  const email = String(raw).trim().toLowerCase();
  return email.length ? email : null;
}

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

function isStudentRosterOutboxPath(path: string): boolean {
  return /^teams\/[^/]+\/students\/[^/]+$/.test(path);
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

  for (const r of rows) {
    const isScoreOrSession = r.path.startsWith('scores/') || r.path.startsWith('sessions/');

    if (isScoreOrSession && !canSyncScores) {
      // Auth/profile not ready yet — keep outbox rows for a later sync attempt.
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

      // Never downgrade roster status active → pending from a stale join outbox row.
      if (isStudentRosterOutboxPath(r.path)) {
        const ref = docRefForPath(db, r.path);
        const existing = await getDoc(ref);
        if (existing.exists()) {
          const serverStatus = String(existing.data().status ?? 'active');
          const payloadStatus = String(payload.status ?? 'pending');
          if (serverStatus === 'active' && payloadStatus === 'pending') {
            synced.push(r.id);
            continue;
          }
        }
      }

      await flushOutboxRow(r.path, payload);
      synced.push(r.id);
    } catch (e) {
      if (isPermissionDenied(e)) {
        console.warn('[Ocupulse] syncOutbox permission denied — keeping row for retry', r.id);
      } else {
        console.warn('[Ocupulse] syncOutbox failed for row', r.id, e);
      }
    }
  }

  if (synced.length) await deleteOutboxIds(synced);
}

/** Remove orphaned score/session rows that cannot sync (e.g. from old sessions). */
export async function clearStaleOutboxRows(): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;

  const rows = await getAllOutbox();
  if (!rows.length) return;

  const profile = user ? await getUserProfile(user.uid) : null;
  const canSyncScores =
    profile?.role === 'teacher' || (profile?.role === 'student' && Boolean(user?.uid));

  const stale = rows
    .filter(
      (r) =>
        r.path.startsWith('scores/') ||
        r.path.startsWith('sessions/') ||
        r.path.startsWith('teams/') ||
        r.path.includes('/students/'),
    )
    .filter((r) => {
      if (r.path.startsWith('scores/') || r.path.startsWith('sessions/')) {
        return !canSyncScores;
      }
      return false;
    })
    .map((r) => r.id);

  if (stale.length) await deleteOutboxIds(stale);
}

/** Rebuild outbox entries for local results that lost their sync queue. */
export async function requeueUnsyncedExperiments(): Promise<void> {
  const user = getCurrentUser();
  const profile = user ? await getUserProfile(user.uid) : null;
  if (!user || profile?.role !== 'student') return;

  const [results, outbox] = await Promise.all([resultsDao.findAll(), getAllOutbox()]);
  const outboxPaths = new Set(outbox.map((r) => r.path));

  for (const result of results) {
    if (!result.id || !result.activityType || result.score == null) continue;
    if (result.synced === 1 && outboxPaths.has(`scores/${result.id}`)) continue;

    const scoresPath = `scores/${result.id}`;
    const sessionsPath = `sessions/${result.id}`;
    if (outboxPaths.has(scoresPath) && outboxPaths.has(sessionsPath)) continue;

    let payload: Record<string, unknown> = {};
    if (result.dataJson) {
      try {
        payload = JSON.parse(result.dataJson) as Record<string, unknown>;
      } catch {
        payload = {};
      }
    }

    const session = useSessionStore.getState();
    const teamName = String(payload.teamName ?? session.teamName ?? 'Demo Team');
    const teamId = result.teamId ?? session.teamId ?? null;
    const studentId = result.studentId ?? session.studentId ?? null;
    const userId = result.userId ?? user.uid;
    const submittedAt = Number(payload.submittedAt ?? payload.updatedAt ?? Date.now());
    const teacherId = await getTeamTeacherId(teamId);

    const authAnonymous = isAnonymousExperiment(payload, userId);
    const ownerEmail = ownerEmailFromPayload(payload);

    const docPayload = {
      ...payload,
      teamName,
      activityType: result.activityType,
      score: result.score,
      teamId,
      studentId,
      userId,
      teacherId,
      sessionId: result.id,
      authAnonymous,
      ownerEmail,
      updatedAt: submittedAt,
      submittedAt,
    };

    if (!outboxPaths.has(scoresPath)) {
      await insertOutbox(scoresPath, docPayload);
      outboxPaths.add(scoresPath);
    }

    const sessionRow = await sessionsDao.findById(result.id);
    if (!outboxPaths.has(sessionsPath)) {
      await insertOutbox(sessionsPath, {
        teamId,
        studentId,
        teacherId,
        activityType: result.activityType,
        startTime: sessionRow?.startTime ?? submittedAt,
        createdBy: sessionRow?.createdBy ?? userId,
        authAnonymous,
        ownerEmail,
        updatedAt: submittedAt,
      });
      outboxPaths.add(sessionsPath);
    }
  }
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
  const authAnonymous = user?.isAnonymous ?? false;
  const ownerEmail = user?.email?.trim() || null;
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
    authAnonymous,
    ownerEmail,
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
    authAnonymous,
    ownerEmail,
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
    authAnonymous,
    ownerEmail,
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
