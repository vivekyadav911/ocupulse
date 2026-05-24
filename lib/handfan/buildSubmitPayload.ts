import { forceFromStiffness } from '../calc/handfanForce';
import type { HandfanSessionState } from './sessionState';
import {
  allTrialsComplete,
  averageActualAngle,
  STIFFNESS_OPTIONS,
  trialsAsArray,
} from './sessionState';

export type HandfanSubmitPayload = {
  activityId: 3;
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
  material: 'paper' | 'cardboard';
  trials: {
    design: 1 | 2 | 3;
    distanceCm: 15 | 30 | 45;
    predictedAngleDeg: number;
    actualAngleDeg: number;
    observationNotes: string;
  }[];
  forceCalculation: {
    stiffnessK: number;
    stiffnessLabel: string;
    angleDeg: number;
    forceN: number;
  } | null;
  reflection: {
    stiffnessEffect: string;
    designInfluence: string;
    distanceEffect: string;
  };
};

export type HandfanTeamMeta = {
  teamName: string;
  memberName: string;
  gradeLevel: string;
};

export type HandfanLocation = {
  lat: number;
  lng: number;
  address?: string;
  suburb?: string;
} | null;

function buildForceCalculation(
  state: HandfanSessionState,
): HandfanSubmitPayload['forceCalculation'] {
  const angleParsed = Number.parseFloat(state.forceCalc.angleDeg);
  if (!Number.isFinite(angleParsed) || angleParsed <= 0) return null;
  const stiffness = STIFFNESS_OPTIONS.find((o) => o.k === state.forceCalc.stiffnessK);
  const label = stiffness?.label ?? state.forceCalc.stiffnessLabel;
  return {
    stiffnessK: state.forceCalc.stiffnessK,
    stiffnessLabel: label,
    angleDeg: angleParsed,
    forceN: forceFromStiffness(angleParsed, state.forceCalc.stiffnessK),
  };
}

export function buildHandfanSubmitPayload(
  state: HandfanSessionState,
  team: HandfanTeamMeta,
  location: HandfanLocation,
): HandfanSubmitPayload {
  if (!allTrialsComplete(state.trials)) {
    throw new Error('Complete all 9 trials before uploading.');
  }

  const trials = trialsAsArray(state.trials).map((t) => {
    const predicted = Number.parseFloat(t.predictedAngleDeg);
    if (!Number.isFinite(predicted)) {
      throw new Error(`Invalid predicted angle for design ${t.design}, ${t.distanceCm} cm.`);
    }
    if (t.actualAngleDeg == null) {
      throw new Error(`Missing actual angle for design ${t.design}, ${t.distanceCm} cm.`);
    }
    return {
      design: t.design,
      distanceCm: t.distanceCm,
      predictedAngleDeg: predicted,
      actualAngleDeg: t.actualAngleDeg,
      observationNotes: t.observationNotes.trim(),
    };
  });

  return {
    activityId: 3,
    submittedAt: new Date().toISOString(),
    team,
    location,
    material: state.material,
    trials,
    forceCalculation: buildForceCalculation(state),
    reflection: { ...state.reflection },
  };
}

export { averageActualAngle };
