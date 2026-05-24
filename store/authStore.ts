import type { User } from 'firebase/auth';
import { create } from 'zustand';

type AuthState = {
  /** `undefined` = Firebase auth listener has not fired yet. */
  user: User | null | undefined;
  /** Firestore profile applied to sessionStore for the current user. */
  profileHydrated: boolean;
  setUser: (u: User | null | undefined) => void;
  setProfileHydrated: (hydrated: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  profileHydrated: false,
  setUser: (user) => set({ user }),
  setProfileHydrated: (profileHydrated) => set({ profileHydrated }),
}));
