import type { UserProfile, UserRole } from '../services/db/types';
import { getTeamTeacherId } from '../services/profiles';

/** Student account that never finished name/team setup. */
export function isIncompleteStudentProfile(profile: UserProfile): boolean {
  return profile.role === 'student' && !profile.teamId && !profile.studentId;
}

/** Resolves role from Firestore plus team ownership (fixes mis-labeled profiles). */
export async function inferEffectiveRole(uid: string, profile: UserProfile): Promise<UserRole> {
  if (profile.role === 'teacher' || (profile.managedTeamIds?.length ?? 0) > 0) {
    return 'teacher';
  }
  if (profile.teamId) {
    const teacherId = await getTeamTeacherId(profile.teamId);
    if (teacherId === uid) return 'teacher';
  }
  return profile.role;
}
