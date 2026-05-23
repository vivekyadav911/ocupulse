import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { getCurrentUser, getUserProfile, updateUserProfile } from './auth';
import { insertOutbox, studentsDao, teamsDao } from './db/sqlite';
import type { Student, Team } from './db/types';
import { getFirestoreDb } from './firebase';

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function findTeamByName(name: string): Promise<Team | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const localTeams = await teamsDao.findAll();
  const local = localTeams.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
  if (local) return local;

  const db = getFirestoreDb();
  if (!db) return null;
  const q = query(collection(db, 'teams'), where('name', '==', trimmed));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0]!;
  const data = d.data();
  const team: Team = {
    id: d.id,
    name: String(data.name ?? trimmed),
    teacherId: data.teacherId != null ? String(data.teacherId) : null,
    schoolId: data.schoolId != null ? String(data.schoolId) : null,
    synced: 1,
  };
  await teamsDao.insert(team);
  return team;
}

export async function createOrJoinTeam(teamName: string): Promise<Team> {
  const existing = await findTeamByName(teamName);
  if (existing) return existing;

  const user = getCurrentUser();
  const team: Team = {
    id: newId(),
    name: teamName.trim() || 'Team',
    teacherId: user && !user.isAnonymous ? user.uid : null,
    schoolId: null,
    synced: 0,
  };
  await teamsDao.insert(team);
  await insertOutbox(`teams/${team.id}`, {
    name: team.name,
    teacherId: team.teacherId,
    schoolId: team.schoolId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return team;
}

export async function setupStudentProfile(input: {
  firstName: string;
  teamName: string;
}): Promise<{ team: Team; student: Student }> {
  const user = getCurrentUser();
  if (!user) throw new Error('Not signed in');

  const team = await createOrJoinTeam(input.teamName);
  const student: Student = {
    id: newId(),
    firstName: input.firstName.trim() || 'Student',
    teamId: team.id,
    uid: user.uid,
    deviceId: null,
    synced: 0,
  };

  await studentsDao.insert(student);
  await insertOutbox(`teams/${team.id}/students/${student.id}`, {
    firstName: student.firstName,
    uid: student.uid,
    teamId: team.id,
    createdAt: Date.now(),
  });

  await updateUserProfile(user.uid, {
    role: 'student',
    displayName: student.firstName,
    teamId: team.id,
    studentId: student.id,
  });

  return { team, student };
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
  role?: 'teacher' | 'student';
}> {
  const profile = await getUserProfile(uid);
  if (!profile) return { profileReady: false };

  if (profile.role === 'teacher') {
    return { profileReady: true, role: 'teacher' };
  }

  const { teamId, studentId } = profile;
  if (!teamId || !studentId) return { profileReady: false, role: 'student' };

  await pullTeamRoster(teamId);
  const team = await teamsDao.findById(teamId);
  const student = await studentsDao.findById(studentId);

  return {
    profileReady: true,
    role: 'student',
    teamId,
    studentId,
    teamName: team?.name,
    studentFirstName: student?.firstName ?? profile.displayName,
  };
}
