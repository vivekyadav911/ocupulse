/** Ensure clip URIs work with expo-video / expo-av playback sources. */
export function normalizeClipUri(uri: string): string {
  if (!uri) return uri;
  if (uri.startsWith('file://') || uri.startsWith('blob:') || uri.startsWith('content://')) {
    return uri;
  }
  if (uri.startsWith('/')) return `file://${uri}`;
  return uri;
}
