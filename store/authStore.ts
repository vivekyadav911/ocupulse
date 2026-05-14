import type { User } from 'firebase/auth';
import { create } from 'zustand';

type AuthState = {
  user: User | null | undefined;
  setUser: (u: User | null | undefined) => void;
};

/** `undefined` = still hydrating from persistence. */
export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  setUser: (user) => set({ user }),
}));
