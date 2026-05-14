import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Mode = 'light' | 'dark';

type ThemeState = {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggle: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      setMode: (mode) => set({ mode }),
      toggle: () => set({ mode: get().mode === 'light' ? 'dark' : 'light' }),
    }),
    {
      name: 'stemm-theme',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
