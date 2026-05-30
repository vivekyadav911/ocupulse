export type ExperimentActor = {
  userId: string;
  isAnonymous: boolean;
  email?: string | null;
};

export function normalizeEmail(email: string | null | undefined): string | null {
  if (email == null) return null;
  const normalized = String(email).trim().toLowerCase();
  return normalized.length ? normalized : null;
}

export function getOwnerEmail(payload: Record<string, unknown>): string | null {
  return normalizeEmail(payload.ownerEmail != null ? String(payload.ownerEmail) : null);
}

/**
 * Anonymous experiment: no owner email and saved from anonymous quick join
 * (or legacy local row with no registered owner metadata).
 */
export function isAnonymousExperiment(
  payload: Record<string, unknown>,
  _ownerUserId: string | null,
): boolean {
  if (getOwnerEmail(payload)) return false;
  if (payload.authAnonymous === false) return false;
  if (payload.authAnonymous === true) return true;
  // Legacy rows without registered owner metadata — shared anonymous pool.
  return true;
}

export function isRegisteredExperiment(
  payload: Record<string, unknown>,
  ownerUserId: string | null,
): boolean {
  return !isAnonymousExperiment(payload, ownerUserId);
}

function actorOwnsRegisteredExperiment(
  actor: ExperimentActor,
  ownerUserId: string | null,
  payload: Record<string, unknown>,
): boolean {
  const ownerEmail = getOwnerEmail(payload);
  const actorEmail = normalizeEmail(actor.email);
  if (ownerEmail && actorEmail && ownerEmail === actorEmail) return true;
  return !actor.isAnonymous && ownerUserId === actor.userId;
}

export function shouldIncludeExperimentForStudent(
  actor: ExperimentActor,
  ownerUserId: string | null,
  payload: Record<string, unknown>,
): boolean {
  if (isAnonymousExperiment(payload, ownerUserId)) return true;
  return actorOwnsRegisteredExperiment(actor, ownerUserId, payload);
}

/** Anonymous experiments: any signed-in student. Registered: matching email/uid only. */
export function canDeleteExperiment(
  actor: ExperimentActor,
  ownerUserId: string | null,
  payload: Record<string, unknown>,
): boolean {
  if (isAnonymousExperiment(payload, ownerUserId)) return true;
  return actorOwnsRegisteredExperiment(actor, ownerUserId, payload);
}

export function deleteExperimentDeniedMessage(
  actor: ExperimentActor,
  payload: Record<string, unknown>,
  ownerUserId: string | null,
): string {
  if (isRegisteredExperiment(payload, ownerUserId)) {
    const ownerEmail = getOwnerEmail(payload);
    if (ownerEmail) {
      return `Only the signed-in account for ${ownerEmail} can delete this experiment.`;
    }
    return 'You can only delete your own experiments.';
  }
  return 'You cannot delete this experiment.';
}
