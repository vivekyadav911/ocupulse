import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  teamId: string | null;
  studentId: string | null;
  teamName: string;
  studentFirstName: string;
  gradeLevel: GradeLevel;
  profileReady: boolean;
  currentActivity: ActivityType | null;
  currentSessionId: string | null;
  setTeam: (
    t: Partial<
      Pick<
        SessionState,
        'teamName' | 'studentFirstName' | 'gradeLevel' | 'teamId' | 'studentId' | 'profileReady'
      >
    >,
  ) => void;
  setActivity: (a: ActivityType | null) => void;
  setSessionId: (id: string | null) => void;
  resetProfile: () => void;
  showAdsInterstitial: () => boolean;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      teamId: null,
      studentId: null,
      teamName: 'Demo Team',
      studentFirstName: 'Student',
      gradeLevel: 'Year 6',
      profileReady: false,
      currentActivity: null,
      currentSessionId: null,
      setTeam: (partial) => set(partial),
      setActivity: (currentActivity) => set({ currentActivity }),
      setSessionId: (currentSessionId) => set({ currentSessionId }),
      resetProfile: () =>
        set({
          teamId: null,
          studentId: null,
          teamName: 'Demo Team',
          studentFirstName: 'Student',
          profileReady: false,
        }),
      showAdsInterstitial: () => {
        const g = get().gradeLevel;
        return g === 'Year 9' || g === 'Year 10' || g === 'High School';
      },
    }),
    {
      name: 'ocupulse-session',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
