import type { ChallengeReflection, ChallengeState, TabData, TabKey } from './challengeState';
import { TAB_KEYS } from './challengeState';
import {
  calculate,
  fmtCalc,
  gForceForPath,
  parsePositive,
  type GForcePath,
} from '../calc/parachuteCalc';

export type RunSummary = {
  tabKey: TabKey;
  designName: string;
  predictedFallTimeS: number | null;
  recordedFallTimeS: number | null;
  finalVelocityMps: number | null;
  gForce: number | null;
  riskLabel: string | null;
  gForcePath: GForcePath;
};

export function summarizeTabRun(tabKey: TabKey, tab: TabData, massKg: string): RunSummary {
  const height = parsePositive(tab.dropHeightM);
  const fallTime = parsePositive(tab.recordedFallTimeS);
  const mass = parsePositive(massKg) ?? 0.2;
  const contact = parsePositive(tab.contactTimeS);
  const tUp = parsePositive(tab.tUpS);

  const kinematics = calculate({
    heightM: height ?? 0,
    fallTimeS: fallTime ?? 0,
    massKg: mass,
    contactTimeS: contact ?? 0,
    hasBounce: tab.gForcePath === 'bounce',
    tUpS: tUp ?? undefined,
  });

  const gResult = gForceForPath(kinematics.finalVelocity, contact, tab.gForcePath, tUp);

  return {
    tabKey,
    designName: tab.designName,
    predictedFallTimeS: parsePositive(tab.predictedFallTimeS),
    recordedFallTimeS: fallTime,
    finalVelocityMps: kinematics.finalVelocity,
    gForce: gResult.gForce,
    riskLabel: gResult.riskLabel,
    gForcePath: tab.gForcePath,
  };
}

export function summarizeAllRuns(state: ChallengeState): RunSummary[] {
  return TAB_KEYS.map((key) => summarizeTabRun(key, state.tabs[key], state.massKg));
}

export function bestRunIndex(runs: RunSummary[]): number | null {
  let bestIdx: number | null = null;
  let bestV: number | null = null;
  runs.forEach((r, i) => {
    if (r.finalVelocityMps == null) return;
    if (bestV == null || r.finalVelocityMps < bestV) {
      bestV = r.finalVelocityMps;
      bestIdx = i;
    }
  });
  return bestIdx;
}

export function activeTabCalc(state: ChallengeState) {
  const tab = state.tabs[state.activeTab];
  const height = parsePositive(tab.dropHeightM);
  const fallTime = parsePositive(tab.recordedFallTimeS);
  const mass = parsePositive(state.massKg) ?? 0.2;
  const contact = parsePositive(tab.contactTimeS);
  const tUp = parsePositive(tab.tUpS);

  const kinematics = calculate({
    heightM: height ?? 0,
    fallTimeS: fallTime ?? 0,
    massKg: mass,
    contactTimeS: contact ?? 0,
    hasBounce: tab.gForcePath === 'bounce',
    tUpS: tUp ?? undefined,
  });

  const gResult = gForceForPath(kinematics.finalVelocity, contact, tab.gForcePath, tUp);

  return { kinematics, gResult, contact, fallTime, height, mass, tUp };
}

export function formatSessionTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export { fmtCalc };

export type ParachuteSubmitPayload = {
  activityId: 1;
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
  massKg: number;
  primaryMode: boolean;
  runs: {
    tabKey: TabKey;
    designName: string;
    dropHeightM: number;
    predictedFallTimeS: number;
    recordedFallTimeS: number;
    contactTimeS: number | null;
    finalVelocityMps: number | null;
    gForce: number | null;
    riskLabel: string | null;
    gForcePath: GForcePath;
    tUpS: number | null;
    videoUri: string | null;
    firstContactFrame: number | null;
    stoppedFrame: number | null;
  }[];
  reflection: ChallengeReflection;
};

export function buildSubmitPayload(
  state: ChallengeState,
  team: { teamName: string; memberName: string; gradeLevel: string },
  location: {
    lat: number;
    lng: number;
    address?: string;
    suburb?: string;
  } | null,
): ParachuteSubmitPayload {
  const mass = parsePositive(state.massKg) ?? 0.2;

  return {
    activityId: 1,
    submittedAt: new Date().toISOString(),
    team,
    location,
    massKg: mass,
    primaryMode: state.primaryMode,
    runs: TAB_KEYS.map((key) => {
      const tab = state.tabs[key];
      const summary = summarizeTabRun(key, tab, state.massKg);
      return {
        tabKey: key,
        designName: tab.designName,
        dropHeightM: parsePositive(tab.dropHeightM) ?? 0,
        predictedFallTimeS: parsePositive(tab.predictedFallTimeS) ?? 0,
        recordedFallTimeS: parsePositive(tab.recordedFallTimeS) ?? 0,
        contactTimeS: parsePositive(tab.contactTimeS),
        finalVelocityMps: summary.finalVelocityMps,
        gForce: summary.gForce,
        riskLabel: summary.riskLabel,
        gForcePath: tab.gForcePath,
        tUpS: parsePositive(tab.tUpS),
        videoUri: tab.videoUri,
        firstContactFrame: tab.firstContactFrame,
        stoppedFrame: tab.stoppedFrame,
      };
    }),
    reflection: { ...state.reflection },
  };
}
