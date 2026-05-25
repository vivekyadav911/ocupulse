import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { withoutUndefined } from '../lib/firestoreSanitize';
import type { TeamMemberStatus } from '../store/sessionStore';
import { getCurrentUser, getUserProfile, updateUserProfile } from './auth';
import { deleteOutboxForPath, insertOutbox, studentsDao, teamsDao } from './db/sqlite';
import type { Student, Team } from './db/types';
import { getFirestoreDb } from './firebase';

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeTeamName(name: string): string {
  return name.trim().toLowerCase();
}

function teamFirestorePayload(team: Team): Record<string, unknown> {
  return {
    name: team.name,
    nameLower: normalizeTeamName(team.name),
    teacherId: team.teacherId ?? null,
    schoolId: team.schoolId ?? null,
    updatedAt: Date.now(),
  };
}

async function persistTeamDoc(team: Team, created = false): Promise<void> {
  const payload = {
    ...teamFirestorePayload(team),
    ...(created ? { createdAt: Date.now() } : {}),
  };
  await insertOutbox(`teams/${team.id}`, payload);
  const db = getFirestoreDb();
  if (!db) return;
  try {
    await setDoc(doc(db, 'teams', team.id), payload, { merge: true });
  } catch (e) {
    console.warn('[Ocupulse] persistTeamDoc failed', e);
  }
}

function teamFromFirestoreDoc(
  d: { id: string; data: () => Record<string, unknown> },
  fallbackName: string,
): Team {
  const data = d.data();
  return {
    id: d.id,
    name: String(data.name ?? fallbackName),
    teacherId: data.teacherId != null ? String(data.teacherId) : null,
    schoolId: data.schoolId != null ? String(data.schoolId) : null,
    synced: 1,
  };
}

async function cacheTeamLocally(team: Team): Promise<Team> {
  const existing = await teamsDao.findById(team.id);
  if (existing) await teamsDao.update(team);
  else await teamsDao.insert(team);
  return team;
}

async function persistStudentRoster(
  teamId: string,
  student: Student,
  status: 'pending' | 'active',
  email: string,
): Promise<void> {
  const payload = withoutUndefined({
    firstName: student.firstName,
    uid: student.uid ?? null,
    email: email || null,
    teamId,
    status,
    updatedAt: Date.now(),
    ...(status === 'pending' ? { requestedAt: Date.now() } : { approvedAt: Date.now() }),
  });
  const rosterDocId = student.uid ?? student.id;
  await insertOutbox(`teams/${teamId}/students/${rosterDocId}`, payload);
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Cloud sync is unavailable. Check Firebase in .env and restart Expo with -c.');
  }
  await setDoc(doc(db, 'teams', teamId, 'students', rosterDocId), payload, { merge: true });
  const verify = await getDoc(doc(db, 'teams', teamId, 'students', rosterDocId));
  if (!verify.exists()) {
    throw new Error('Join request could not be saved. Check your connection and try again.');
  }
  // Roster is on Firestore — drop outbox so a later sync cannot overwrite teacher approval with pending.
  await deleteOutboxForPath(`teams/${teamId}/students/${rosterDocId}`);
}

/** Prefer Firestore (source of truth); local SQLite is cache only. */
async function findTeamInFirestore(trimmed: string, nameLower: string): Promise<Team | null> {
  const db = getFirestoreDb();
  if (!db) return null;

  const matches: Team[] = [];

  const byLower = await getDocs(
    query(collection(db, 'teams'), where('nameLower', '==', nameLower)),
  );
  for (const d of byLower.docs) {
    matches.push(teamFromFirestoreDoc(d, trimmed));
  }

  if (matches.length === 0) {
    const byExact = await getDocs(query(collection(db, 'teams'), where('name', '==', trimmed)));
    for (const d of byExact.docs) {
      matches.push(teamFromFirestoreDoc(d, trimmed));
    }
  }

  if (matches.length === 0) {
    const all = await getDocs(collection(db, 'teams'));
    for (const d of all.docs) {
      const data = d.data();
      const name = String(data.name ?? '');
      if (normalizeTeamName(name) === nameLower) {
        matches.push(teamFromFirestoreDoc(d, trimmed));
      }
    }
  }

  if (matches.length === 0) return null;

  const supervised = matches.filter((t) => t.teacherId);
  const pick = supervised.length > 0 ? supervised[0]! : matches[0]!;

  // Do not write the parent team doc here — Firestore rules allow only the teacher to update teams/{id}.
  return pick;
}

export async function findTeamByName(name: string): Promise<Team | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const nameLower = normalizeTeamName(trimmed);

  const remote = await findTeamInFirestore(trimmed, nameLower);
  if (remote) return cacheTeamLocally(remote);

  const localTeams = await teamsDao.findAll();
  const local = localTeams.find((t) => normalizeTeamName(t.name) === nameLower);
  return local ?? null;
}

/** Ensures teacher teams in Firestore have nameLower for case-insensitive student joins. */
export async function backfillTeacherTeamNameLower(teacherId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db || !teacherId) return;
  const snap = await getDocs(query(collection(db, 'teams'), where('teacherId', '==', teacherId)));
  await Promise.all(
    snap.docs.map((d) => {
      const data = d.data();
      const teamName = String(data.name ?? '');
      return setDoc(
        d.ref,
        { name: teamName, nameLower: normalizeTeamName(teamName) },
        { merge: true },
      );
    }),
  );
}

/** Students join by team name; never set teacherId. */
export async function createOrJoinTeam(teamName: string): Promise<Team> {
  const existing = await findTeamByName(teamName);
  if (existing) return existing;

  const team: Team = {
    id: newId(),
    name: teamName.trim() || 'Team',
    teacherId: null,
    schoolId: null,
    synced: 0,
  };
  await teamsDao.insert(team);
  await persistTeamDoc(team, true);
  return team;
}

export async function createTeacherTeam(input: {
  displayName: string;
  teamName: string;
}): Promise<Team> {
  const user = getCurrentUser();
  if (!user) throw new Error('Not signed in');

  const trimmed = input.teamName.trim();
  if (!trimmed) throw new Error('Team name is required');

  const existing = await findTeamByName(trimmed);
  if (existing?.teacherId && existing.teacherId !== user.uid) {
    throw new Error('This team name is already supervised by another teacher.');
  }

  const team: Team = existing ?? {
    id: newId(),
    name: trimmed,
    teacherId: user.uid,
    schoolId: null,
    synced: 0,
  };

  team.teacherId = user.uid;
  team.name = trimmed;

  const local = await teamsDao.findById(team.id);
  if (local) await teamsDao.update(team);
  else await teamsDao.insert(team);

  await persistTeamDoc(team, !existing);

  const managedTeamIds = existing ? [team.id] : [team.id];
  await updateUserProfile(user.uid, {
    role: 'teacher',
    displayName: input.displayName.trim() || user.email?.split('@')[0] || 'Teacher',
    managedTeamIds,
    profileReady: true,
  });

  return team;
}

export async function setupStudentProfile(input: {
  firstName: string;
  teamName: string;
}): Promise<{ team: Team; student: Student }> {
  const user = getCurrentUser();
  if (!user) throw new Error('Not signed in');

  const trimmedTeam = input.teamName.trim();
  const team = await findTeamByName(trimmedTeam);
  if (!team?.teacherId) {
    throw new Error(
      `No teacher team matched "${trimmedTeam}". Ask your teacher for the exact team name on their dashboard.`,
    );
  }
  const student: Student = {
    id: user.uid,
    firstName: input.firstName.trim() || 'Student',
    teamId: team.id,
    uid: user.uid,
    deviceId: null,
    synced: 0,
  };

  const existingLocal = await studentsDao.findById(user.uid);
  if (existingLocal) await studentsDao.update({ ...existingLocal, ...student, teamId: team.id });
  else await studentsDao.insert(student);

  const joinStatus: 'pending' | 'active' = team.teacherId ? 'pending' : 'active';
  await persistStudentRoster(team.id, student, joinStatus, user.email ?? '');

  await updateUserProfile(user.uid, {
    role: 'student',
    displayName: student.firstName,
    teamId: team.id,
    studentId: student.id,
    profileReady: true,
  });

  return { team, student };
}

export async function fetchStudentMemberStatus(
  teamId: string,
  studentId: string,
): Promise<TeamMemberStatus> {
  const db = getFirestoreDb();
  if (!db) return 'active';
  const snap = await getDoc(doc(db, 'teams', teamId, 'students', studentId));
  if (!snap.exists()) return 'none';
  const status = String(snap.data().status ?? 'active');
  return status === 'pending' ? 'pending' : 'active';
}

export function subscribeStudentMemberStatus(
  teamId: string,
  studentId: string,
  onStatus: (status: TeamMemberStatus) => void,
): () => void {
  const db = getFirestoreDb();
  if (!db) {
    onStatus('active');
    return () => {};
  }
  return onSnapshot(
    doc(db, 'teams', teamId, 'students', studentId),
    (snap) => {
      if (!snap.exists()) {
        onStatus('none');
        return;
      }
      const status = String(snap.data().status ?? 'active');
      onStatus(status === 'pending' ? 'pending' : 'active');
    },
    () => onStatus('active'),
  );
}

export async function getTeamTeacherId(teamId: string | null): Promise<string | null> {
  if (!teamId) return null;
  const local = await teamsDao.findById(teamId);
  if (local?.teacherId) return local.teacherId;

  const db = getFirestoreDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'teams', teamId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return data.teacherId != null ? String(data.teacherId) : null;
}

export async function pullTeamRoster(teamId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;

  const teamSnap = await getDoc(doc(db, 'teams', teamId));
  if (teamSnap.exists()) {
    const data = teamSnap.data();
    const team: Team = {
      id: teamSnap.id,
      name: String(data.name ?? ''),
      teacherId: data.teacherId != null ? String(data.teacherId) : null,
      schoolId: data.schoolId != null ? String(data.schoolId) : null,
      synced: 1,
    };
    const existing = await teamsDao.findById(team.id);
    if (existing) await teamsDao.update(team);
    else await teamsDao.insert(team);
  }

  const studentsSnap = await getDocs(collection(db, 'teams', teamId, 'students'));
  for (const d of studentsSnap.docs) {
    const data = d.data();
    const student: Student = {
      id: d.id,
      firstName: String(data.firstName ?? 'Student'),
      teamId,
      uid: data.uid != null ? String(data.uid) : null,
      deviceId: data.deviceId != null ? String(data.deviceId) : null,
      synced: 1,
    };
    const existing = await studentsDao.findById(student.id);
    if (existing) await studentsDao.update(student);
    else await studentsDao.insert(student);
  }
}

export async function hydrateProfileFromCloud(uid: string): Promise<{
  profileReady: boolean;
  teamId?: string;
  studentId?: string;
  teamName?: string;
  studentFirstName?: string;
  displayName?: string;
  role?: 'teacher' | 'student';
  managedTeamIds?: string[];
  activeTeamId?: string;
  teamMemberStatus?: TeamMemberStatus;
}> {
  const profile = await getUserProfile(uid);
  if (!profile) return { profileReady: false };

  if (profile.role === 'teacher') {
    const managedTeamIds = profile.managedTeamIds ?? [];
    const profileReady = profile.profileReady === true && managedTeamIds.length > 0;
    let teamName: string | undefined;
    if (managedTeamIds[0]) {
      await pullTeamRoster(managedTeamIds[0]);
      const team = await teamsDao.findById(managedTeamIds[0]);
      teamName = team?.name;
    }
    return {
      profileReady,
      role: 'teacher',
      displayName: profile.displayName,
      managedTeamIds,
      activeTeamId: managedTeamIds[0],
      teamName,
    };
  }

  const { teamId, studentId } = profile;
  const profileReady = profile.profileReady === true && Boolean(teamId && studentId);
  if (!teamId || !studentId) {
    return {
      profileReady: false,
      role: 'student',
      displayName: profile.displayName,
    };
  }

  await pullTeamRoster(teamId);
  const team = await teamsDao.findById(teamId);
  const student = await studentsDao.findById(studentId);
  const teamMemberStatus = await fetchStudentMemberStatus(teamId, studentId);

  return {
    profileReady,
    role: 'student',
    teamId,
    studentId,
    teamName: team?.name,
    studentFirstName: student?.firstName ?? profile.displayName,
    displayName: student?.firstName ?? profile.displayName,
    teamMemberStatus,
  };
}
