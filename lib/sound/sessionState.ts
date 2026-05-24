import type { PollutionTier, SoundPrediction } from '../calc/soundLevel';
import { isPredictionCorrect } from '../calc/soundLevel';

export type SoundReflection = {
  surprises: string;
  earMuffRecommendation: string;
};

export type SoundCapture = {
  id: string;
  actionLabel: string;
  prediction: SoundPrediction | null;
  peakDb: number;
  lat: number;
  lng: number;
  address?: string;
  capturedAt: string;
  predictionCorrect: boolean | null;
};

export type SoundSessionState = {
  captures: SoundCapture[];
  reflection: SoundReflection;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  uploadError: string | null;
  pendingPrediction: SoundPrediction | null;
};

export function createInitialSoundSessionState(): SoundSessionState {
  return {
    captures: [],
    reflection: { surprises: '', earMuffRecommendation: '' },
    uploadStatus: 'idle',
    uploadError: null,
    pendingPrediction: null,
  };
}

export type CreateCaptureInput = {
  actionLabel: string;
  peakDb: number;
  lat: number;
  lng: number;
  address?: string;
  prediction: SoundPrediction | null;
  previousPeakDb: number | null;
};

export function createSoundCapture(input: CreateCaptureInput): SoundCapture {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actionLabel: input.actionLabel.trim(),
    prediction: input.prediction,
    peakDb: Math.round(input.peakDb),
    lat: input.lat,
    lng: input.lng,
    address: input.address,
    capturedAt: new Date().toISOString(),
    predictionCorrect: isPredictionCorrect(input.prediction, input.peakDb, input.previousPeakDb),
  };
}

export type SoundSessionSummary = {
  loudestAction: string;
  quietestAction: string;
  avgDb: number;
  earProtectionRecommended: boolean;
};

export function summarizeSoundSession(captures: SoundCapture[]): SoundSessionSummary | null {
  if (captures.length === 0) return null;

  let loudest = captures[0]!;
  let quietest = captures[0]!;
  let sum = 0;

  for (const c of captures) {
    sum += c.peakDb;
    if (c.peakDb > loudest.peakDb) loudest = c;
    if (c.peakDb < quietest.peakDb) quietest = c;
  }

  return {
    loudestAction: `${loudest.actionLabel} (${Math.round(loudest.peakDb)} dB)`,
    quietestAction: `${quietest.actionLabel} (${Math.round(quietest.peakDb)} dB)`,
    avgDb: Math.round(sum / captures.length),
    earProtectionRecommended: captures.some((c) => c.peakDb > 85),
  };
}

export function pollutionTierForCapture(peakDb: number): PollutionTier {
  if (peakDb > 85) return 'loud';
  if (peakDb >= 60) return 'moderate';
  return 'quiet';
}
