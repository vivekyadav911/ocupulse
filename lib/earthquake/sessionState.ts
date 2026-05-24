import type { EarthquakeReadings } from '../calc/earthquakeDisplacement';

export const DESIGNS = [1, 2, 3] as const;
export type EarthquakeDesign = (typeof DESIGNS)[number];

export const PREDICTED_MOVEMENTS = ['<1cm', '1-2cm', '2-4cm', '>4cm'] as const;
export type PredictedMovement = (typeof PREDICTED_MOVEMENTS)[number];

export const TEST_DURATIONS_SEC = [5, 10, 20] as const;
export type EarthquakeTestDurationSec = (typeof TEST_DURATIONS_SEC)[number];
export const DEFAULT_TEST_DURATION_SEC: EarthquakeTestDurationSec = 20;

export type EarthquakeDesignRun = {
  design: EarthquakeDesign;
  folds: string;
  pillars: string;
  designNote: string;
  predictedMovement: PredictedMovement | null;
  testDurationSec: EarthquakeTestDurationSec | null;
  readings: EarthquakeReadings | null;
  completedAt: string | null;
};

export type EarthquakeReflection = {
  bestDesignWhy: string;
  surprises: string;
};

export type EarthquakeSessionState = {
  activeDesign: EarthquakeDesign;
  testDurationSec: EarthquakeTestDurationSec;
  runs: Record<EarthquakeDesign, EarthquakeDesignRun>;
  reflection: EarthquakeReflection;
  testPhase: 'idle' | 'running' | 'runDone';
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  uploadError: string | null;
};

export function createEmptyRun(design: EarthquakeDesign): EarthquakeDesignRun {
  return {
    design,
    folds: '',
    pillars: '',
    designNote: '',
    predictedMovement: null,
    testDurationSec: null,
    readings: null,
    completedAt: null,
  };
}

export function createInitialEarthquakeSessionState(): EarthquakeSessionState {
  return {
    activeDesign: 1,
    testDurationSec: DEFAULT_TEST_DURATION_SEC,
    runs: {
      1: createEmptyRun(1),
      2: createEmptyRun(2),
      3: createEmptyRun(3),
    },
    reflection: { bestDesignWhy: '', surprises: '' },
    testPhase: 'idle',
    uploadStatus: 'idle',
    uploadError: null,
  };
}

export function runsAsArray(
  runs: Record<EarthquakeDesign, EarthquakeDesignRun>,
): EarthquakeDesignRun[] {
  return DESIGNS.map((d) => runs[d]);
}

export function completedRunCount(runs: Record<EarthquakeDesign, EarthquakeDesignRun>): number {
  return runsAsArray(runs).filter((r) => r.readings != null).length;
}

export function allRunsComplete(runs: Record<EarthquakeDesign, EarthquakeDesignRun>): boolean {
  return completedRunCount(runs) === DESIGNS.length;
}

export function nextIncompleteDesign(
  runs: Record<EarthquakeDesign, EarthquakeDesignRun>,
): EarthquakeDesign | null {
  for (const d of DESIGNS) {
    if (runs[d].readings == null) return d;
  }
  return null;
}
