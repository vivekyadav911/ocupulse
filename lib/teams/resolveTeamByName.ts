import { findTeamByName } from '../../services/profiles';

export type ResolvedTeam = {
  id: string;
  name: string;
  isNew: boolean;
  hasTeacher: boolean;
};

/** Same team name always resolves to the same team id (create-or-join). */
export async function resolveTeamByName(teamName: string): Promise<ResolvedTeam | null> {
  const trimmed = teamName.trim();
  if (!trimmed) return null;

  const before = await findTeamByName(trimmed);
  if (before) {
    return {
      id: before.id,
      name: before.name,
      isNew: false,
      hasTeacher: Boolean(before.teacherId),
    };
  }

  const { createOrJoinTeam } = await import('../../services/profiles');
  const team = await createOrJoinTeam(trimmed);
  const after = await findTeamByName(trimmed);
  const resolved = after ?? team;
  return {
    id: resolved.id,
    name: resolved.name,
    isNew: true,
    hasTeacher: Boolean(resolved.teacherId),
  };
}
