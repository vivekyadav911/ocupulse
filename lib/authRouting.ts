import type { UserRole } from '../services/db/types';

export type AuthRedirect =
  | null
  | 'loading'
  | '/(auth)/login'
  | '/(auth)/student-setup'
  | '/(auth)/teacher-setup';

export function resolveAuthRedirect(input: {
  user: unknown;
  role: UserRole | null;
  profileReady: boolean;
  hydrated: boolean;
}): AuthRedirect {
  if (!input.hydrated) return 'loading';
  if (!input.user) return '/(auth)/login';
  if (!input.role) return '/(auth)/student-setup';
  if (input.role === 'student' && !input.profileReady) return '/(auth)/student-setup';
  if (input.role === 'teacher' && !input.profileReady) return '/(auth)/teacher-setup';
  return null;
}
