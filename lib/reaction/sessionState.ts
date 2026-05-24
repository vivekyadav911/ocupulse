import { percentSlower, type MovingWaveConfig } from '../calc/reactionStats';

export type TracePoint = { x: number; y: number; t: number };

export type ReactionPhase =
  | 'intro'
  | 'phase1'
  | 'phase1Summary'
  | 'phase2'
  | 'phase2Summary'
  | 'phase3'
  | 'phase3Results'
  | 'statistics';

export type HandUsed = 'left' | 'right';

export type Phase1Result = {
  appearTs: number;
  tapTs: number;
  reactionMs: number;
};

export type Phase2Result = {
  appearTs: number;
  tapTs: number;
  reactionMs: number;
  handUsed: HandUsed;
};

export type Phase3Result = {
  tracePath: TracePoint[];
  accuracyPct: number;
  avgDelayMs: number;
  idealTrace: TracePoint[];
  waveSnapshots: TracePoint[][];
  waveConfig: MovingWaveConfig;
};

export type ReactionReflection = {
  predictedReactionMs: string;
  surprises: string;
  practiceHelped: string;
};

export type TeamAggregates = {
  phase1Mean: number | null;
  phase1StdDev: number | null;
  phase1Fastest: number | null;
  phase2Mean: number | null;
  phase2StdDev: number | null;
  phase2Fastest: number | null;
  phase3AccuracyMean: number | null;
  phase3AccuracyStdDev: number | null;
  scatterData: { memberName: string; phase1Ms: number; phase3AccuracyPct: number }[];
};

export type ReactionSessionState = {
  phase: ReactionPhase;
  handUsed: HandUsed;
  phase1: Phase1Result | null;
  phase2: Phase2Result | null;
  phase3: Phase3Result | null;
  reflection: ReactionReflection;
  teamStats: TeamAggregates | null;
  uploadStatus: 'idle' | 'uploading' | 'error';
  uploadError: string | null;
};

export type DominantNonDominantComparison = {
  dominantMs: number;
  nonDominantMs: number;
  differenceMs: number;
  percentSlower: number;
};

export function createInitialReactionSessionState(): ReactionSessionState {
  return {
    phase: 'intro',
    handUsed: 'right',
    phase1: null,
    phase2: null,
    phase3: null,
    reflection: { predictedReactionMs: '', surprises: '', practiceHelped: '' },
    teamStats: null,
    uploadStatus: 'idle',
    uploadError: null,
  };
}

export function phase1Complete(state: ReactionSessionState): boolean {
  return state.phase1 != null;
}

export function phase2Complete(state: ReactionSessionState): boolean {
  return state.phase2 != null;
}

export function phase3Complete(state: ReactionSessionState): boolean {
  return state.phase3 != null;
}

export function allPhasesComplete(state: ReactionSessionState): boolean {
  return phase1Complete(state) && phase2Complete(state) && phase3Complete(state);
}

export function dominantNonDominantComparison(
  state: ReactionSessionState,
): DominantNonDominantComparison | null {
  if (!state.phase1 || !state.phase2) return null;
  const dominantMs = state.phase1.reactionMs;
  const nonDominantMs = state.phase2.reactionMs;
  return {
    dominantMs,
    nonDominantMs,
    differenceMs: nonDominantMs - dominantMs,
    percentSlower: percentSlower(nonDominantMs, dominantMs),
  };
}
