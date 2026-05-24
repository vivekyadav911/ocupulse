export const DESIGNS = [1, 2, 3] as const;
export const DISTANCES_CM = [15, 30, 45] as const;
export const MATERIALS = ['paper', 'cardboard'] as const;

export type HandfanDesign = (typeof DESIGNS)[number];
export type HandfanDistanceCm = (typeof DISTANCES_CM)[number];
export type HandfanMaterial = (typeof MATERIALS)[number];
export type TrialKey = `${HandfanDesign}-${HandfanDistanceCm}`;

export type StiffnessOption = {
  label: string;
  k: number;
};

export const STIFFNESS_OPTIONS: StiffnessOption[] = [
  { label: 'Thin paper', k: 0.05 },
  { label: 'Card', k: 0.2 },
  { label: 'Thin cardboard', k: 0.5 },
  { label: 'Corrugated', k: 2.5 },
];

export type HandfanTrial = {
  design: HandfanDesign;
  distanceCm: HandfanDistanceCm;
  predictedAngleDeg: string;
  actualAngleDeg: number | null;
  observationNotes: string;
};

export type HandfanReflection = {
  stiffnessEffect: string;
  designInfluence: string;
  distanceEffect: string;
};

export type HandfanSessionState = {
  material: HandfanMaterial;
  activeDesign: HandfanDesign;
  activeDistanceCm: HandfanDistanceCm;
  trials: Record<TrialKey, HandfanTrial>;
  lastRecordedAngleDeg: number | null;
  forceCalc: {
    stiffnessK: number;
    stiffnessLabel: string;
    angleDeg: string;
  };
  reflection: HandfanReflection;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  uploadError: string | null;
};

export function trialKey(design: HandfanDesign, distanceCm: HandfanDistanceCm): TrialKey {
  return `${design}-${distanceCm}`;
}

export function createEmptyTrial(
  design: HandfanDesign,
  distanceCm: HandfanDistanceCm,
): HandfanTrial {
  return {
    design,
    distanceCm,
    predictedAngleDeg: '',
    actualAngleDeg: null,
    observationNotes: '',
  };
}

export function createInitialTrials(): Record<TrialKey, HandfanTrial> {
  const trials = {} as Record<TrialKey, HandfanTrial>;
  for (const design of DESIGNS) {
    for (const distanceCm of DISTANCES_CM) {
      trials[trialKey(design, distanceCm)] = createEmptyTrial(design, distanceCm);
    }
  }
  return trials;
}

export function createInitialHandfanSessionState(): HandfanSessionState {
  const defaultStiffness = STIFFNESS_OPTIONS[0]!;
  return {
    material: 'paper',
    activeDesign: 1,
    activeDistanceCm: 15,
    trials: createInitialTrials(),
    lastRecordedAngleDeg: null,
    forceCalc: {
      stiffnessK: defaultStiffness.k,
      stiffnessLabel: defaultStiffness.label,
      angleDeg: '',
    },
    reflection: {
      stiffnessEffect: '',
      designInfluence: '',
      distanceEffect: '',
    },
    uploadStatus: 'idle',
    uploadError: null,
  };
}

export function trialsAsArray(trials: Record<TrialKey, HandfanTrial>): HandfanTrial[] {
  const rows: HandfanTrial[] = [];
  for (const design of DESIGNS) {
    for (const distanceCm of DISTANCES_CM) {
      rows.push(trials[trialKey(design, distanceCm)]);
    }
  }
  return rows;
}

export function completedTrialCount(trials: Record<TrialKey, HandfanTrial>): number {
  return trialsAsArray(trials).filter((t) => t.actualAngleDeg != null).length;
}

export function allTrialsComplete(trials: Record<TrialKey, HandfanTrial>): boolean {
  return completedTrialCount(trials) === DESIGNS.length * DISTANCES_CM.length;
}

export function averageActualAngle(trials: Record<TrialKey, HandfanTrial>): number {
  const recorded = trialsAsArray(trials).filter((t) => t.actualAngleDeg != null);
  if (recorded.length === 0) return 0;
  const sum = recorded.reduce((acc, t) => acc + (t.actualAngleDeg ?? 0), 0);
  return Math.round(sum / recorded.length);
}

export function nextIncompleteTrial(
  trials: Record<TrialKey, HandfanTrial>,
): { design: HandfanDesign; distanceCm: HandfanDistanceCm } | null {
  for (const design of DESIGNS) {
    for (const distanceCm of DISTANCES_CM) {
      const trial = trials[trialKey(design, distanceCm)];
      if (trial.actualAngleDeg == null) {
        return { design, distanceCm };
      }
    }
  }
  return null;
}

export function materialLabel(material: HandfanMaterial): string {
  return material === 'paper' ? 'Paper' : 'Cardboard';
}
