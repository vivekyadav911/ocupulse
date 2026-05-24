import { hardestMovement, smoothnessRating } from '../calc/humanperfJerk';
import {
  allMovementsComplete,
  attemptsAsArray,
  MOVEMENTS,
  movementLabel,
  type HumanperfSessionState,
} from './sessionState';

export type HumanperfSubmitPayload = {
  activityId: 5;
  submittedAt: string;
  team: {
    teamName: string;
    memberName: string;
    gradeLevel: string;
  };
  location: {
    lat: number;
    lng: number;
    address?: string;
    suburb?: string;
  } | null;
  feedbackModeEnabled: boolean;
  feedbackThresholdMm: number;
  attemptDurationSec: number;
  attempts: {
    movement: 1 | 2 | 3;
    movementLabel: string;
    avgJerkMm: number;
    peakJerkMm: number;
    durationSec: number;
    smoothnessRating: string;
    jerkSeries: { t: number; jerkMm: number }[];
    recordedAt: string;
  }[];
  chartData: {
    movementLabels: string[];
    avgJerkMm: number[];
    ratings: string[];
  };
  summary: {
    hardestMovement: 1 | 2 | 3;
    hardestMovementLabel: string;
    hardestAvgJerkMm: number;
  };
  reflection: {
    hardestToKeepSmooth: string;
    feedbackHelped: string;
    surprises: string;
  };
};

export type HumanperfTeamMeta = {
  teamName: string;
  memberName: string;
  gradeLevel: string;
};

export type HumanperfLocation = {
  lat: number;
  lng: number;
  address?: string;
  suburb?: string;
} | null;

export function buildHumanperfSubmitPayload(
  state: HumanperfSessionState,
  team: HumanperfTeamMeta,
  location: HumanperfLocation,
): HumanperfSubmitPayload {
  if (!allMovementsComplete(state.attempts)) {
    throw new Error('Complete all 3 movements before uploading.');
  }

  const attempts = attemptsAsArray(state.attempts).map((a) => ({
    movement: a.movement,
    movementLabel: movementLabel(a.movement),
    avgJerkMm: a.avgJerkMm,
    peakJerkMm: a.peakJerkMm,
    durationSec: a.durationSec,
    smoothnessRating: a.smoothnessRating,
    jerkSeries: a.jerkSeries,
    recordedAt: a.recordedAt,
  }));

  const chartAttempts = attempts.map((a) => ({
    movement: a.movement,
    avgJerkMm: a.avgJerkMm,
  }));
  const hardest = hardestMovement(chartAttempts)!;

  return {
    activityId: 5,
    submittedAt: new Date().toISOString(),
    team,
    location,
    feedbackModeEnabled: state.feedbackEnabled,
    feedbackThresholdMm: state.feedbackThresholdMm,
    attemptDurationSec: state.attemptDurationSec,
    attempts,
    chartData: {
      movementLabels: MOVEMENTS.map((m) => m.label),
      avgJerkMm: MOVEMENTS.map((m) => state.attempts[m.id]?.avgJerkMm ?? 0),
      ratings: MOVEMENTS.map((m) => {
        const avg = state.attempts[m.id]?.avgJerkMm ?? 0;
        return smoothnessRating(avg);
      }),
    },
    summary: {
      hardestMovement: hardest.movement,
      hardestMovementLabel: movementLabel(hardest.movement),
      hardestAvgJerkMm: hardest.avgJerkMm,
    },
    reflection: { ...state.reflection },
  };
}
