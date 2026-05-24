import type { SoundPrediction } from '../calc/soundLevel';
import type { SoundCapture, SoundReflection, SoundSessionSummary } from './sessionState';
import { summarizeSoundSession } from './sessionState';

export type SoundSubmitPayload = {
  activityId: 2;
  submittedAt: string;
  team: {
    teamName: string;
    memberName: string;
    gradeLevel: string;
  };
  captures: {
    actionLabel: string;
    prediction: SoundPrediction | null;
    peakDb: number;
    lat: number;
    lng: number;
    address?: string;
    capturedAt: string;
    predictionCorrect: boolean | null;
  }[];
  summary: SoundSessionSummary;
  reflection: SoundReflection;
};

export function buildSoundSubmitPayload(
  captures: SoundCapture[],
  reflection: SoundReflection,
  team: { teamName: string; memberName: string; gradeLevel: string },
): SoundSubmitPayload {
  const summary = summarizeSoundSession(captures);
  if (!summary) {
    throw new Error('Add at least one capture before uploading.');
  }

  return {
    activityId: 2,
    submittedAt: new Date().toISOString(),
    team,
    captures: captures.map((c) => ({
      actionLabel: c.actionLabel,
      prediction: c.prediction,
      peakDb: c.peakDb,
      lat: c.lat,
      lng: c.lng,
      address: c.address,
      capturedAt: c.capturedAt,
      predictionCorrect: c.predictionCorrect,
    })),
    summary,
    reflection: { ...reflection },
  };
}
