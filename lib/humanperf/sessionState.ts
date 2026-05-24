import type { JerkSeriesPoint, SmoothnessRating } from '../calc/humanperfJerk';

export const MOVEMENTS = [
  { id: 1 as const, label: 'Circle', instruction: 'Rotate hand in a circle' },
  { id: 2 as const, label: 'Up / Down', instruction: 'Move hand up and down slowly' },
  { id: 3 as const, label: 'Side to Side', instruction: 'Move hand horizontally side to side' },
];

export type HumanperfMovementId = (typeof MOVEMENTS)[number]['id'];

export const ATTEMPT_DURATIONS_SEC = [10, 20, 30] as const;
export type HumanperfAttemptDurationSec = (typeof ATTEMPT_DURATIONS_SEC)[number];
export const DEFAULT_ATTEMPT_DURATION_SEC: HumanperfAttemptDurationSec = 20;

export const DEFAULT_FEEDBACK_THRESHOLD_MM = 15;

export type HumanperfAttempt = {
  movement: HumanperfMovementId;
  avgJerkMm: number;
  peakJerkMm: number;
  durationSec: number;
  smoothnessRating: SmoothnessRating;
  jerkSeries: JerkSeriesPoint[];
  recordedAt: string;
};

export type HumanperfReflection = {
  hardestToKeepSmooth: string;
  feedbackHelped: string;
  surprises: string;
};

export type HumanperfAttemptPhase = 'idle' | 'recording' | 'attemptDone';

export type HumanperfSessionState = {
  activeMovement: HumanperfMovementId;
  attemptDurationSec: HumanperfAttemptDurationSec;
  attempts: Record<HumanperfMovementId, HumanperfAttempt | null>;
  feedbackEnabled: boolean;
  feedbackThresholdMm: number;
  attemptPhase: HumanperfAttemptPhase;
  reflection: HumanperfReflection;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  uploadError: string | null;
};

export function createInitialHumanperfSessionState(): HumanperfSessionState {
  return {
    activeMovement: 1,
    attemptDurationSec: DEFAULT_ATTEMPT_DURATION_SEC,
    attempts: { 1: null, 2: null, 3: null },
    feedbackEnabled: false,
    feedbackThresholdMm: DEFAULT_FEEDBACK_THRESHOLD_MM,
    attemptPhase: 'idle',
    reflection: { hardestToKeepSmooth: '', feedbackHelped: '', surprises: '' },
    uploadStatus: 'idle',
    uploadError: null,
  };
}

export function attemptsAsArray(
  attempts: Record<HumanperfMovementId, HumanperfAttempt | null>,
): HumanperfAttempt[] {
  return MOVEMENTS.map((m) => attempts[m.id]).filter((a): a is HumanperfAttempt => a != null);
}

export function completedMovementCount(
  attempts: Record<HumanperfMovementId, HumanperfAttempt | null>,
): number {
  return attemptsAsArray(attempts).length;
}

export function allMovementsComplete(
  attempts: Record<HumanperfMovementId, HumanperfAttempt | null>,
): boolean {
  return completedMovementCount(attempts) === MOVEMENTS.length;
}

export function nextIncompleteMovement(
  attempts: Record<HumanperfMovementId, HumanperfAttempt | null>,
): HumanperfMovementId | null {
  for (const m of MOVEMENTS) {
    if (attempts[m.id] == null) return m.id;
  }
  return null;
}

export function movementLabel(id: HumanperfMovementId): string {
  return MOVEMENTS.find((m) => m.id === id)?.label ?? `Movement ${id}`;
}

export function movementInstruction(id: HumanperfMovementId): string {
  return MOVEMENTS.find((m) => m.id === id)?.instruction ?? '';
}
