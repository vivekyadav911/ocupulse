import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { LeaderboardFilter, LeaderRow } from './firestore';
import { payloadFromUnknown } from '../lib/scores/stored';
import { getFirestoreDb } from './firebase';
import { leaderRowFromStored } from './leaderboard';

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
        return {
          id: d.id,
          firstName: String(data.firstName ?? 'Student'),
          uid: data.uid != null ? String(data.uid) : null,
          email: data.email != null ? String(data.email) : null,
          teamId,
          status: 'active',
        };
      });
      if (__DEV__) {
        console.log(`[Ocupulse] roster team=${teamId} members=${rows.length}`);
      }
      onRows(rows);
    },
    (err) => {
      console.error('[Ocupulse] subscribeTeamStudents failed', teamId, err);
      onRows([]);
    },
  );
}

export async function getStudentScoreHistory(studentId: string): Promise<StudentScoreRow[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(collection(db, 'scores'), where('studentId', '==', studentId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const x = payloadFromUnknown(d.data());
      const activityType = String(x.activityType ?? '');
      const score = Number(x.score ?? 0);
      const row = leaderRowFromStored(d.id, activityType, score, x);
      return {
        ...row,
        studentId,
        sessionId: x.sessionId != null ? String(x.sessionId) : d.id,
        updatedAt: row.submittedAt,
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
  return {
    id: match.id,
    firstName: String(data.firstName ?? 'Student'),
    uid: data.uid != null ? String(data.uid) : null,
    email: data.email != null ? String(data.email) : null,
    teamId,
    status: 'active',
  };
}
