/** Firestore rejects `undefined` field values — omit those keys. */
export function withoutUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) as Partial<T>;
}
