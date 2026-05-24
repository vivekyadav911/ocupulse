import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ChallengeState } from '../lib/parachute/challengeState';
import { createInitialChallengeState } from '../lib/parachute/challengeState';

export type ParachuteDraftSnapshot = {
  scopeKey: string;
  savedAt: number;
  state: ChallengeState;
};

type ParachuteDraftStore = {
  draft: ParachuteDraftSnapshot | null;
  setDraft: (scopeKey: string, state: ChallengeState) => void;
  clearDraft: () => void;
  getDraftForScope: (scopeKey: string) => ChallengeState | null;
};

function sanitizeForPersist(state: ChallengeState): ChallengeState {
  return {
    ...state,
    sessionTimer: { ...state.sessionTimer, running: false },
    uploadStatus: 'idle',
    uploadError: null,
  };
}

export function parachuteScopeKey(teamId: string | null, studentId: string | null): string {
  return `${teamId ?? 'no-team'}:${studentId ?? 'no-student'}`;
}

export function isDraftEmpty(state: ChallengeState): boolean {
  const initial = createInitialChallengeState();
  const hasTabData = Object.values(state.tabs).some(
    (tab) =>
      tab.dropHeightM !== '' ||
      tab.predictedFallTimeS !== '' ||
      tab.recordedFallTimeS !== '' ||
      tab.videoUri != null ||
      tab.firstContactFrame != null ||
      tab.stoppedFrame != null,
  );
  const hasReflection =
    state.reflection.bestDesign !== '' ||
    state.reflection.easiestDesign !== '' ||
    state.reflection.predictionsCorrect !== '';
  const timerChanged = state.sessionTimer.secsLeft !== initial.sessionTimer.secsLeft;
  return !hasTabData && !hasReflection && !timerChanged && state.massKg === initial.massKg;
}

export const useParachuteDraftStore = create<ParachuteDraftStore>()(
  persist(
    (set, get) => ({
      draft: null,
      setDraft: (scopeKey, state) => {
        if (isDraftEmpty(state)) {
          set({ draft: null });
          return;
        }
        set({
          draft: {
            scopeKey,
            savedAt: Date.now(),
            state: sanitizeForPersist(state),
          },
        });
      },
      clearDraft: () => set({ draft: null }),
      getDraftForScope: (scopeKey) => {
        const { draft } = get();
        if (!draft || draft.scopeKey !== scopeKey) return null;
        return sanitizeForPersist(draft.state);
      },
    }),
    {
      name: '@ocupulse/parachute-draft',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
