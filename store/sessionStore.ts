import { create } from 'zustand';

export type GradeLevel =
  | 'Year 3'
  | 'Year 4'
  | 'Year 5'
  | 'Year 6'
  | 'Year 7'
  | 'Year 8'
  | 'Year 9'
  | 'Year 10'
  | 'High School';

export type ActivityType =
  | 'parachute'
  | 'sound'
  | 'handfan'
  | 'earthquake'
  | 'humanperf'
  | 'reaction'
  | 'breathing';

type SessionState = {
  teamName: string;
  studentFirstName: string;
  gradeLevel: GradeLevel;
  currentActivity: ActivityType | null;
  currentSessionId: string | null;
  setTeam: (t: Partial<Pick<SessionState, 'teamName' | 'studentFirstName' | 'gradeLevel'>>) => void;
  setActivity: (a: ActivityType | null) => void;
  setSessionId: (id: string | null) => void;
  /** True when grade represents high school cohort — enables interstitial ads (kid-safe gate). */
  showAdsInterstitial: () => boolean;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  teamName: 'Demo Team',
  studentFirstName: 'Student',
  gradeLevel: 'Year 6',
  currentActivity: null,
  currentSessionId: null,
  setTeam: (partial) => set(partial),
  setActivity: (currentActivity) => set({ currentActivity }),
  setSessionId: (currentSessionId) => set({ currentSessionId }),
  showAdsInterstitial: () => {
    const g = get().gradeLevel;
    return g === 'Year 9' || g === 'Year 10' || g === 'High School';
  },
}));
