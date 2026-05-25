/** Personal practice runs (teacher or quick-join) vs team library / roster management. */
export type ExperimentsScope = 'personal' | 'team';

export function experimentsScopeFromParam(value: string | string[] | undefined): ExperimentsScope {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'team' ? 'team' : 'personal';
}

export function isPersonalPracticePayload(payload: Record<string, unknown>): boolean {
  if (payload.personalPractice === true) return true;
  if (payload.createdByTeacher === true) return false;
  return payload.teamId == null || payload.teamId === '';
}

export function teacherCanManageExperimentRecord(
  payload: Record<string, unknown>,
  teamId: string | null | undefined,
  activeTeamId: string | null | undefined,
): boolean {
  if (isPersonalPracticePayload(payload)) return false;
  if (payload.createdByTeacher === true) return true;
  const recordTeamId = payload.teamId != null ? String(payload.teamId) : teamId;
  return Boolean(activeTeamId && recordTeamId === activeTeamId);
}
