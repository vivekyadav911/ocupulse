import { activityDisplayName } from '../lib/activities/labels';
import { useSessionStore } from '../store/sessionStore';
import { attachLocalMedia, writeSessionOptimistic } from './firestore';
import { notifyExperimentSaved } from './notifications';
import { persistMedia, queueMediaPersist } from './storage';

export async function saveActivityResult(input: {
  activityType: string;
  score: number;
  payload: Record<string, unknown>;
  mediaLocalUri?: string | null;
  mediaMimeType?: string;
}): Promise<string> {
  const session = useSessionStore.getState();
  const personalPractice = session.role === 'teacher';
  const practiceName = session.displayName?.trim() || 'Teacher';

  const sessionId = await writeSessionOptimistic({
    activityType: input.activityType,
    teamName: personalPractice ? `${practiceName} (practice)` : session.teamName,
    teamId: personalPractice ? null : session.teamId,
    studentId: personalPractice ? null : session.studentId,
    studentFirstName: personalPractice ? practiceName : session.studentFirstName,
    score: input.score,
    payload: { ...input.payload, ...(personalPractice ? { personalPractice: true } : {}) },
    personalPractice,
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

  void notifyExperimentSaved(activityDisplayName(input.activityType));
  return sessionId;
}
