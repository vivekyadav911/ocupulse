import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { getCurrentUser, getUserProfile, updateUserProfile } from './auth';
import { studentsDao } from './db/sqlite';
import { createTeacherTeam, findTeamByName } from './profiles';
import { getFirestoreDb } from './firebase';

export async function createManagedTeam(
  teamName: string,
  displayName?: string,
): Promise<{ id: string; name: string; managedTeamIds: string[] }> {
  const user = getCurrentUser();
  if (!user) throw new Error('Not signed in');
  const team = await createTeacherTeam({
    displayName: displayName?.trim() || user.displayName || user.email?.split('@')[0] || 'Teacher',
    teamName: teamName.trim(),
  });
  const profile = await getUserProfile(user.uid);
  const managedTeamIds = [...new Set([...(profile?.managedTeamIds ?? []), team.id])];
  await updateUserProfile(user.uid, { managedTeamIds, profileReady: true });
  return { id: team.id, name: team.name, managedTeamIds };
}

export async function approveTeamStudent(teamId: string, studentId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore unavailable');
  await setDoc(
    doc(db, 'teams', teamId, 'students', studentId),
    { status: 'active', approvedAt: Date.now() },
    { merge: true },
  );
}

export async function removeTeamStudent(teamId: string, studentId: string): Promise<void> {
  const db = getFirestoreDb();
  if (db) {
    await deleteDoc(doc(db, 'teams', teamId, 'students', studentId));
  }
  const local = await studentsDao.findById(studentId);
  if (local) {
    await studentsDao.update({ ...local, teamId: null });
  }
}

export async function lookupTeamIdByName(name: string): Promise<string | null> {
  const team = await findTeamByName(name.trim());
  return team?.teacherId ? team.id : null;
}
