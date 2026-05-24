import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { LeaderboardFilter, LeaderRow } from './firestore';
import { getFirestoreDb } from './firebase';
import { leaderRowFromStored } from './leaderboard';
import { prepareLeaderboardRows } from '../lib/leaderboard/rankRows';

export type TeamSummary = {
  id: string;
  name: string;
  teacherId: string | null;
};

export type StudentRosterRow = {
  id: string;
  firstName: string;
  uid: string | null;
  email: string | null;
  teamId: string;
  status: 'pending' | 'active';
};

export type StudentScoreRow = LeaderRow & {
  sessionId?: string;
  updatedAt?: number;
};

export function subscribeTeacherTeams(
  teacherId: string,
  onTeams: (teams: TeamSummary[]) => void,
): Unsubscribe {
  const db = getFirestoreDb();
  if (!db) {
    onTeams([]);
    return () => {};
  }
  const q = query(collection(db, 'teams'), where('teacherId', '==', teacherId));
  return onSnapshot(
    q,
    (snap) => {
      const teams = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: String(data.name ?? ''),
          teacherId: data.teacherId != null ? String(data.teacherId) : null,
        };
      });
      onTeams(teams);
    },
    () => onTeams([]),
  );
}

export function subscribeTeamStudents(
  teamId: string,
  onRows: (rows: StudentRosterRow[]) => void,
): Unsubscribe {
  const db = getFirestoreDb();
  if (!db) {
    onRows([]);
    return () => {};
  }
  const col = collection(db, 'teams', teamId, 'students');
  return onSnapshot(
    col,
    (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data();
        const statusRaw = String(data.status ?? 'active');
        return {
          id: d.id,
          firstName: String(data.firstName ?? 'Student'),
          uid: data.uid != null ? String(data.uid) : null,
          email: data.email != null ? String(data.email) : null,
          teamId,
          status: statusRaw === 'pending' ? 'pending' : 'active',
        };
      });
      onRows(rows);
    },
    () => onRows([]),
  );
}

export function subscribeTeamScores(
  teamId: string,
  activityType: LeaderboardFilter,
  onRows: (rows: StudentScoreRow[]) => void,
): Unsubscribe {
  const db = getFirestoreDb();
  if (!db) {
    onRows([]);
    return () => {};
  }
  const q = query(collection(db, 'scores'), where('teamId', '==', teamId));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => {
        const x = d.data() as Record<string, unknown>;
        const activityType = String(x.activityType ?? '');
        const score = Number(x.score ?? 0);
        const row = leaderRowFromStored(d.id, activityType, score, x);
        return {
          ...row,
          sessionId: x.sessionId != null ? String(x.sessionId) : undefined,
          updatedAt: x.updatedAt != null ? Number(x.updatedAt) : undefined,
          address: x.address != null ? String(x.address) : undefined,
        };
      });
      onRows(prepareLeaderboardRows(rows, activityType));
    },
    () => onRows([]),
  );
}

export async function getStudentScoreHistory(studentId: string): Promise<StudentScoreRow[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(collection(db, 'scores'), where('studentId', '==', studentId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const x = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        teamName: String(x.teamName ?? ''),
        score: Number(x.score ?? 0),
        activityType: String(x.activityType ?? ''),
        studentId,
        sessionId: x.sessionId != null ? String(x.sessionId) : undefined,
        updatedAt: x.updatedAt != null ? Number(x.updatedAt) : undefined,
      };
    })
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

export async function getStudentProfile(
  teamId: string,
  studentId: string,
): Promise<StudentRosterRow | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const snap = await getDocs(collection(db, 'teams', teamId, 'students'));
  const match = snap.docs.find((d) => d.id === studentId);
  if (!match) return null;
  const data = match.data();
  const statusRaw = String(data.status ?? 'active');
  return {
    id: match.id,
    firstName: String(data.firstName ?? 'Student'),
    uid: data.uid != null ? String(data.uid) : null,
    email: data.email != null ? String(data.email) : null,
    teamId,
    status: statusRaw === 'pending' ? 'pending' : 'active',
  };
}
