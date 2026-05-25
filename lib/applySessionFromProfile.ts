import type { UserRole } from '../services/db/types';
import { useSessionStore, type TeamMemberStatus } from '../store/sessionStore';

export type HydratedSession = {
  profileReady: boolean;
  role?: UserRole;
  teamId?: string | null;
  studentId?: string | null;
  teamName?: string;
  studentFirstName?: string;
  displayName?: string;
  managedTeamIds?: string[];
  activeTeamId?: string | null;
  teamMemberStatus?: TeamMemberStatus;
};

/** Applies cloud/local profile to session store without keeping stale fields from a prior account. */
export function applySessionFromProfile(hydrated: HydratedSession) {
  const store = useSessionStore.getState();

  if (hydrated.role === 'teacher') {
    store.setRole('teacher');
    store.setTeam({
      role: 'teacher',
      profileReady: hydrated.profileReady,
      teamId: hydrated.activeTeamId ?? hydrated.teamId ?? null,
      studentId: null,
      studentFirstName: '',
      displayName: hydrated.displayName?.trim() || '',
      teamName: hydrated.teamName ?? 'Demo Team',
      managedTeamIds: hydrated.managedTeamIds ?? [],
      activeTeamId: hydrated.activeTeamId ?? hydrated.teamId ?? null,
      teamMemberStatus: 'none',
    });
    return;
  }

  if (hydrated.role === 'student') {
    const name = hydrated.studentFirstName?.trim() || hydrated.displayName?.trim() || 'Student';
    store.setRole('student');
    store.setTeam({
      role: 'student',
      profileReady: hydrated.profileReady,
      teamId: hydrated.teamId ?? null,
      studentId: hydrated.studentId ?? null,
      studentFirstName: name,
      displayName: name,
      teamName: hydrated.teamName ?? 'Demo Team',
      managedTeamIds: [],
      activeTeamId: hydrated.teamId ?? null,
      teamMemberStatus: hydrated.teamMemberStatus ?? 'active',
    });
    return;
  }

  store.setTeam({ profileReady: hydrated.profileReady });
}
