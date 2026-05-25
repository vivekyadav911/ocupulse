import type { TeamMemberStatus } from '../store/sessionStore';

/** Students on a teacher-managed team need roster approval before running experiments. */
export function canStudentRunExperiments(status: TeamMemberStatus): boolean {
  return status !== 'pending';
}
