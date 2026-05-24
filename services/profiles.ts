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
  await insertOutbox(`teams/${team.id}`, {
    name: team.name,
    teacherId: null,
    schoolId: team.schoolId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
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

  await insertOutbox(`teams/${team.id}`, {
    name: team.name,
    teacherId: user.uid,
    schoolId: team.schoolId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

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
  const joinStatus = team.teacherId ? 'pending' : 'active';
  await insertOutbox(`teams/${team.id}/students/${student.id}`, {
    firstName: student.firstName,
    uid: student.uid,
    email: user.email ?? '',
    teamId: team.id,
    status: joinStatus,
    createdAt: Date.now(),
  });

  await updateUserProfile(user.uid, {
    role: 'student',
    displayName: student.firstName,
    teamId: team.id,
    studentId: student.id,
    profileReady: true,
  });

  return { team, student };
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

  return {
    profileReady,
    role: 'student',
    teamId,
    studentId,
    teamName: team?.name,
    studentFirstName: student?.firstName ?? profile.displayName,
    displayName: student?.firstName ?? profile.displayName,
  };
}
