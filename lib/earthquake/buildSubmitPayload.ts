import type { EarthquakeRating } from '../calc/earthquakeDisplacement';
import { ratingLabel, summarizeDesignRuns } from '../calc/earthquakeDisplacement';
import { allRunsComplete, DESIGNS, runsAsArray, type EarthquakeSessionState } from './sessionState';

export type EarthquakeSubmitPayload = {
  activityId: 4;
  submittedAt: string;
  team: {
    teamName: string;
    memberName: string;
    gradeLevel: string;
  };
  designs: {
    design: 1 | 2 | 3;
    folds: number;
    pillars: number;
    designNote: string;
    predictedMovement: string;
    readings: {
      totalDisplacementCm: number;
      peakXCm: number;
      peakYCm: number;
      peakZCm: number;
      peakDisplacementCm: number;
      maxTiltDeg: number;
      rating: EarthquakeRating;
      sampleCount: number;
    };
  }[];
  chartData: {
    labels: string[];
    peakCm: number[];
    ratings: EarthquakeRating[];
  };
  summary: {
    bestDesign: number | null;
    winningFolds: number | null;
    winningPillars: number | null;
    bestPeakCm: number | null;
  };
  reflection: {
    bestDesignWhy: string;
    surprises: string;
  };
};

export type EarthquakeTeamMeta = {
  teamName: string;
  memberName: string;
  gradeLevel: string;
};

function parsePositiveInt(value: string, label: string): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
  return n;
}

export function buildEarthquakeSubmitPayload(
  state: EarthquakeSessionState,
  team: EarthquakeTeamMeta,
): EarthquakeSubmitPayload {
  if (!allRunsComplete(state.runs)) {
    throw new Error('Complete all 3 design tests before uploading.');
  }

  if (!state.reflection.bestDesignWhy.trim()) {
    throw new Error('Answer "Which design worked best and why?" before uploading.');
  }
  if (!state.reflection.surprises.trim()) {
    throw new Error('Answer "Any surprises in the results?" before uploading.');
  }

  const designs = runsAsArray(state.runs).map((run) => {
    if (run.readings == null) {
      throw new Error(`Design ${run.design} is missing readings.`);
    }
    if (run.predictedMovement == null) {
      throw new Error(`Design ${run.design} is missing predicted movement.`);
    }
    return {
      design: run.design,
      folds: parsePositiveInt(run.folds, `Design ${run.design} folds`),
      pillars: parsePositiveInt(run.pillars, `Design ${run.design} pillars`),
      designNote: run.designNote.trim(),
      predictedMovement: run.predictedMovement,
      readings: { ...run.readings },
    };
  });

  const summaryRuns = designs.map((d) => ({
    design: d.design,
    folds: d.folds,
    pillars: d.pillars,
    peakDisplacementCm: d.readings.peakDisplacementCm,
  }));
  const summary = summarizeDesignRuns(summaryRuns);

  return {
    activityId: 4,
    submittedAt: new Date().toISOString(),
    team,
    designs,
    chartData: {
      labels: DESIGNS.map((d) => `Design ${d}`),
      peakCm: designs.map((d) => d.readings.peakDisplacementCm),
      ratings: designs.map((d) => d.readings.rating),
    },
    summary: {
      bestDesign: summary.bestDesign,
      winningFolds: summary.winningFolds,
      winningPillars: summary.winningPillars,
      bestPeakCm: summary.bestPeakCm,
    },
    reflection: { ...state.reflection },
  };
}

export { ratingLabel, summarizeDesignRuns };
