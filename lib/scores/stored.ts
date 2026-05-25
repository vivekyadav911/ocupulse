/** Shared parsing for score/session payloads (Firestore, SQLite, outbox). */

export function payloadFromUnknown(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

export function studentFirstNameFromPayload(payload: Record<string, unknown>): string | undefined {
  if (payload.studentFirstName != null) return String(payload.studentFirstName).trim() || undefined;
  if (payload.memberName != null) return String(payload.memberName).trim() || undefined;
  const team = payload.team;
  if (team && typeof team === 'object' && !Array.isArray(team)) {
    const memberName = (team as Record<string, unknown>).memberName;
    if (memberName != null) return String(memberName).trim() || undefined;
  }
  return undefined;
}
