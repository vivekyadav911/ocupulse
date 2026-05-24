import type { PollutionTier, SoundPrediction } from '../calc/soundLevel';

export type SoundSample = {
  id: string;
  peakDb: number;
  avgDb: number;
  lat: number;
  lng: number;
  address: string;
  teamName?: string;
  actionLabel?: string;
  prediction?: SoundPrediction | null;
  capturedAt?: string;
  predictionCorrect?: boolean | null;
};

export type SoundSamplePayload = {
  peakDb: number;
  avgDb: number;
  lat: number;
  lng: number;
  address: string;
  sampleDurationSec?: number;
  sampleCount?: number;
  pollutionTier?: PollutionTier;
  actionLabel?: string;
  prediction?: SoundPrediction | null;
  capturedAt?: string;
  predictionCorrect?: boolean | null;
};

export type SoundSessionPayload = {
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
  reflection: {
    surprises: string;
    earMuffRecommendation: string;
  };
  summary?: {
    loudestAction: string;
    quietestAction: string;
    avgDb: number;
    earProtectionRecommended: boolean;
  };
};
