/** Ensure clip URIs are `file://` for expo-av `Video` / `Audio` sources. */
export function normalizeClipUri(uri: string): string {
  if (!uri) return uri;
  if (uri.startsWith('file://')) return uri;
  if (uri.startsWith('/')) return `file://${uri}`;
  return uri;
}
