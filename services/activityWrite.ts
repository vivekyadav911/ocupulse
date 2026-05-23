import { useSessionStore } from '../store/sessionStore';
import { attachLocalMedia, writeSessionOptimistic } from './firestore';
import { persistMedia, queueMediaPersist } from './storage';

export async function saveActivityResult(input: {
  activityType: string;
  score: number;
  payload: Record<string, unknown>;
  mediaLocalUri?: string | null;
  mediaMimeType?: string;
}): Promise<string> {
  const { teamName, teamId, studentId } = useSessionStore.getState();

  const sessionId = await writeSessionOptimistic({
    activityType: input.activityType,
    teamName,
    teamId,
    studentId,
    score: input.score,
    payload: input.payload,
  });

  if (input.mediaLocalUri) {
    const mime = input.mediaMimeType ?? 'video/mp4';
    try {
      const saved = await persistMedia({
        localUri: input.mediaLocalUri,
        sessionId,
        mimeType: mime,
      });
      if (saved) {
        await attachLocalMedia(sessionId, saved.localUri);
      }
    } catch {
      await queueMediaPersist(input.mediaLocalUri, sessionId, mime);
    }
  }

  return sessionId;
}
