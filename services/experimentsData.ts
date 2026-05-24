import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { getCurrentUser } from './auth';
import { deleteSessionAndResult, getAllOutbox, resultsDao } from './db/sqlite';
import { getTeamTeacherId } from './profiles';
import { formatLeaderboardDisplay } from '../lib/leaderboard/formatLeaderRow';
import type { ActivityType } from '../store/sessionStore';
import { getAllOutbox, resultsDao } from './db/sqlite';
import { getFirestoreDb } from './firebase';
import type { LeaderboardFilter } from './firestore';

export type ExperimentRecord = {
  id: string;
  sessionId: string;
  activityType: ActivityType;
  score: number;
  submittedAt: number;
  teamName: string;
  studentId?: string;
  studentFirstName?: string;
  payload: Record<string, unknown>;
  synced: boolean;
  scoreLabel?: string;
  detail?: string;
};

function payloadFromUnknown(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function studentFirstNameFromPayload(payload: Record<string, unknown>): string | undefined {
  if (payload.studentFirstName != null) return String(payload.studentFirstName).trim() || undefined;
  if (payload.memberName != null) return String(payload.memberName).trim() || undefined;
  const team = payload.team;
  if (team && typeof team === 'object' && !Array.isArray(team)) {
    const memberName = (team as Record<string, unknown>).memberName;
    if (memberName != null) return String(memberName).trim() || undefined;
  }
  return undefined;
}

export function experimentRecordFromStored(
  id: string,
  activityType: string,
  score: number,
  payload: Record<string, unknown>,
  synced = true,
): ExperimentRecord {
  const teamName = String(payload.teamName ?? 'Demo Team');
  const submittedAt = Number(payload.submittedAt ?? payload.updatedAt ?? 0);
  const display = formatLeaderboardDisplay(activityType, score, payload);
  const sessionId = payload.sessionId != null ? String(payload.sessionId) : id;
  return {
    id,
    sessionId,
    activityType: activityType as ActivityType,
    score,
    submittedAt,
    teamName,
    studentId: payload.studentId != null ? String(payload.studentId) : undefined,
    studentFirstName: studentFirstNameFromPayload(payload),
    payload,
    synced,
    scoreLabel: display.scoreText,
    detail: display.detail,
  };
}

export function mergeExperimentRows(
  remote: ExperimentRecord[],
  local: ExperimentRecord[],
): ExperimentRecord[] {
  const byId = new Map<string, ExperimentRecord>();
  for (const row of [...remote, ...local]) {
    const key = row.sessionId || row.id;
    const existing = byId.get(key);
    if (!existing || row.submittedAt >= existing.submittedAt) {
      byId.set(key, row);
    }
  }
  return [...byId.values()].sort((a, b) => b.submittedAt - a.submittedAt);
}

export async function loadStudentExperimentsLocal(userId: string): Promise<ExperimentRecord[]> {
  const [results, outbox] = await Promise.all([resultsDao.findAll(), getAllOutbox()]);

  const outboxPayloadById = new Map<string, Record<string, unknown>>();
  const pendingIds = new Set<string>();
  for (const row of outbox) {
    if (!row.path.startsWith('scores/')) continue;
    const id = row.path.replace(/^scores\//, '');
    pendingIds.add(id);
    try {
      outboxPayloadById.set(id, payloadFromUnknown(JSON.parse(row.payload)));
    } catch {
      /* skip bad outbox row */
    }
  }

  const rows: ExperimentRecord[] = [];
  for (const r of results) {
    if (!r.activityType || r.score == null) continue;
    if (r.userId && r.userId !== userId) continue;

    let payload = outboxPayloadById.get(r.id) ?? {};
    if (!Object.keys(payload).length && r.dataJson) {
      try {
        payload = payloadFromUnknown(JSON.parse(r.dataJson));
      } catch {
        payload = {};
      }
    }

    const rowUserId = r.userId ?? (payload.userId != null ? String(payload.userId) : null);
    if (rowUserId && rowUserId !== userId) continue;

    rows.push(
      experimentRecordFromStored(r.id, r.activityType, r.score, payload, !pendingIds.has(r.id)),
    );
  }
  return rows;
}

function subscribeFirestoreStudentExperiments(
  userId: string,
  onRows: (rows: ExperimentRecord[]) => void,
): Unsubscribe {
  const db = getFirestoreDb();
  if (!db) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, 'scores'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => {
        const x = payloadFromUnknown(d.data());
        const activityType = String(x.activityType ?? '');
        const score = Number(x.score ?? 0);
        return experimentRecordFromStored(d.id, activityType, score, x, true);
      });
      onRows(rows);
    },
    () => onRows([]),
  );
}

export type ExperimentsSubscription = {
  unsubscribe: () => void;
  refresh: () => void;
};

export function subscribeStudentExperiments(
  userId: string,
  onRows: (rows: ExperimentRecord[]) => void,
): ExperimentsSubscription {
  let localRows: ExperimentRecord[] = [];
  let remoteRows: ExperimentRecord[] = [];

  const publish = () => {
    onRows(mergeExperimentRows(remoteRows, localRows));
  };

  const refreshLocal = () => {
    void loadStudentExperimentsLocal(userId).then((rows) => {
      localRows = rows;
      publish();
    });
  };

  refreshLocal();
  const unsubRemote = subscribeFirestoreStudentExperiments(userId, (rows) => {
    remoteRows = rows;
    publish();
  });

  return {
    unsubscribe: () => unsubRemote(),
    refresh: refreshLocal,
  };
}

export async function loadTeamExperimentsLocal(teamId: string): Promise<ExperimentRecord[]> {
  const results = await resultsDao.findAll();
  const outbox = await getAllOutbox();
  const pendingIds = new Set(
    outbox.filter((r) => r.path.startsWith('scores/')).map((r) => r.path.replace(/^scores\//, '')),
  );
  const rows: ExperimentRecord[] = [];
  for (const r of results) {
    if (!r.activityType || r.score == null || r.teamId !== teamId) continue;
    let payload: Record<string, unknown> = {};
    if (r.dataJson) {
      try {
        payload = payloadFromUnknown(JSON.parse(r.dataJson));
      } catch {
        payload = {};
      }
    }
    rows.push(
      experimentRecordFromStored(r.id, r.activityType, r.score, payload, !pendingIds.has(r.id)),
    );
  }
  return rows;
}

export type TeamExperimentsSubscription = {
  unsubscribe: () => void;
  refresh: () => void;
};

export function subscribeTeamExperiments(
  teamId: string,
  activityFilter: LeaderboardFilter,
  onRows: (rows: ExperimentRecord[]) => void,
): TeamExperimentsSubscription {
  const db = getFirestoreDb();
  let localRows: ExperimentRecord[] = [];
  let remoteRows: ExperimentRecord[] = [];

  const publish = () => {
    let merged = mergeExperimentRows(remoteRows, localRows);
    if (activityFilter !== 'all') {
      merged = merged.filter((r) => r.activityType === activityFilter);
    }
    onRows(merged);
  };

  const refreshLocal = () => {
    void loadTeamExperimentsLocal(teamId).then((rows) => {
      localRows = rows;
      publish();
    });
  };

  refreshLocal();

  if (!db) {
    return { unsubscribe: () => {}, refresh: refreshLocal };
  }

  const q = query(collection(db, 'scores'), where('teamId', '==', teamId));
  const unsubRemote = onSnapshot(
    q,
    (snap) => {
      remoteRows = snap.docs.map((d) => {
        const x = payloadFromUnknown(d.data());
        const activityType = String(x.activityType ?? '');
        const score = Number(x.score ?? 0);
        return experimentRecordFromStored(d.id, activityType, score, x, true);
      });
      publish();
    },
    () => {
      remoteRows = [];
      publish();
    },
  );

  return {
    unsubscribe: () => unsubRemote(),
    refresh: refreshLocal,
  };
}

export async function deleteExperimentRecord(sessionId: string): Promise<void> {
  await deleteSessionAndResult(sessionId);
  const db = getFirestoreDb();
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'scores', sessionId));
  } catch {
    /* may not exist remotely */
  }
  try {
    await deleteDoc(doc(db, 'sessions', sessionId));
  } catch {
    /* ignore */
  }
}

export async function updateExperimentRecord(
  sessionId: string,
  patch: { score?: number; payload?: Record<string, unknown> },
): Promise<ExperimentRecord | null> {
  const existing = await getExperimentRecord(sessionId);
  if (!existing) return null;

  const score = patch.score ?? existing.score;
  const payload = { ...existing.payload, ...patch.payload, score, updatedAt: Date.now() };
  const user = getCurrentUser();
  const teacherId = user ? await getTeamTeacherId(existing.payload.teamId as string) : null;

  const local = await resultsDao.findById(sessionId);
  if (local) {
    await resultsDao.update({
      ...local,
      score,
      dataJson: JSON.stringify(payload),
      synced: 0,
    });
  }

  const db = getFirestoreDb();
  if (db) {
    await setDoc(
      doc(db, 'scores', sessionId),
      {
        ...payload,
        score,
        sessionId,
        updatedAt: Date.now(),
        teacherId: teacherId ?? payload.teacherId,
      },
      { merge: true },
    );
  }

  return experimentRecordFromStored(sessionId, existing.activityType, score, payload, Boolean(db));
}

export async function createTeacherExperiment(input: {
  activityType: ActivityType;
  score: number;
  teamId: string;
  teamName: string;
  studentId?: string;
  studentFirstName?: string;
  payload?: Record<string, unknown>;
}): Promise<string> {
  const user = getCurrentUser();
  if (!user) throw new Error('Not signed in');
  const { writeSessionOptimistic } = await import('./firestore');
  return writeSessionOptimistic({
    activityType: input.activityType,
    teamName: input.teamName,
    teamId: input.teamId,
    studentId: input.studentId ?? null,
    studentFirstName: input.studentFirstName ?? null,
    userId: user.uid,
    score: input.score,
    payload: {
      ...(input.payload ?? {}),
      createdByTeacher: true,
    },
  });
}

export async function getExperimentRecord(sessionId: string): Promise<ExperimentRecord | null> {
  const local = await resultsDao.findById(sessionId);
  if (local?.activityType && local.score != null) {
    let payload: Record<string, unknown> = {};
    if (local.dataJson) {
      try {
        payload = payloadFromUnknown(JSON.parse(local.dataJson));
      } catch {
        payload = {};
      }
    }
    const outbox = await getAllOutbox();
    const pending = outbox.some((r) => r.path === `scores/${sessionId}`);
    return experimentRecordFromStored(local.id, local.activityType, local.score, payload, !pending);
  }

  const db = getFirestoreDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'scores', sessionId));
  if (!snap.exists()) return null;
  const x = payloadFromUnknown(snap.data());
  const activityType = String(x.activityType ?? '');
  const score = Number(x.score ?? 0);
  return experimentRecordFromStored(snap.id, activityType, score, x, true);
}
