export type TabKey = 'baseline' | 'prototype1' | 'prototype2' | 'prototype3';

export type GForcePath = 'noBounce' | 'bounce';

export type TabData = {
  designName: string;
  dropHeightM: string;
  predictedFallTimeS: string;
  recordedFallTimeS: string;
  contactTimeS: string;
  videoUri: string | null;
  firstContactFrame: number | null;
  stoppedFrame: number | null;
  currentReviewFrame: number;
  gForcePath: GForcePath;
  tUpS: string;
};

export type ChallengeReflection = {
  bestDesign: string;
  easiestDesign: string;
  predictionsCorrect: string;
};

export type ChallengeState = {
  activeTab: TabKey;
  primaryMode: boolean;
  massKg: string;
  sessionTimer: { secsLeft: number; running: boolean };
  tabs: Record<TabKey, TabData>;
  reflection: ChallengeReflection;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  uploadError: string | null;
};

export const TAB_KEYS: TabKey[] = ['baseline', 'prototype1', 'prototype2', 'prototype3'];

export const TAB_LABELS: Record<TabKey, string> = {
  baseline: 'Baseline',
  prototype1: 'Prototype 1',
  prototype2: 'Prototype 2',
  prototype3: 'Prototype 3',
};

export const SESSION_SEC = 20 * 60;

export function createInitialTabData(key: TabKey): TabData {
  return {
    designName: TAB_LABELS[key],
    dropHeightM: '',
    predictedFallTimeS: '',
    recordedFallTimeS: '',
    contactTimeS: '0.05',
    videoUri: null,
    firstContactFrame: null,
    stoppedFrame: null,
    currentReviewFrame: 0,
    gForcePath: 'noBounce',
    tUpS: '',
  };
}

export function createInitialChallengeState(): ChallengeState {
  return {
    activeTab: 'baseline',
    primaryMode: false,
    massKg: '0.20',
    sessionTimer: { secsLeft: SESSION_SEC, running: false },
    tabs: {
      baseline: createInitialTabData('baseline'),
      prototype1: createInitialTabData('prototype1'),
      prototype2: createInitialTabData('prototype2'),
      prototype3: createInitialTabData('prototype3'),
    },
    reflection: {
      bestDesign: '',
      easiestDesign: '',
      predictionsCorrect: '',
    },
    uploadStatus: 'idle',
    uploadError: null,
  };
}
