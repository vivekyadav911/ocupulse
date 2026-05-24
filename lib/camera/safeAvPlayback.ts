import type { AVPlaybackStatus, Video } from 'expo-av';

function avErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Benign expo-av errors when seeks/play calls overlap or the audio session is idle. */
export function isBenignAvPlaybackError(error: unknown): boolean {
  const msg = avErrorMessage(error);
  return (
    msg.includes('Seeking interrupted') ||
    msg.includes('audio session not activated') ||
    msg.includes('Cannot complete operation because the player is not ready')
  );
}

export async function safeSetPosition(video: Video | null, positionMillis: number): Promise<void> {
  if (!video) return;
  try {
    await video.setPositionAsync(positionMillis);
  } catch (error) {
    if (!isBenignAvPlaybackError(error)) throw error;
  }
}

export async function safePlay(video: Video | null): Promise<void> {
  if (!video) return;
  try {
    await video.playAsync();
  } catch (error) {
    if (!isBenignAvPlaybackError(error)) throw error;
  }
}

export async function safePause(video: Video | null): Promise<void> {
  if (!video) return;
  try {
    await video.pauseAsync();
  } catch (error) {
    if (!isBenignAvPlaybackError(error)) throw error;
  }
}

export function isLoadedPlaybackStatus(
  status: AVPlaybackStatus,
): status is AVPlaybackStatus & { isLoaded: true } {
  return status.isLoaded;
}
