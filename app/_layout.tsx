import 'react-native-gesture-handler';
import { registerBackgroundSync } from '../services/tasks';

import NetInfo from '@react-native-community/netinfo';
import { Slot } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthChange } from '../services/auth';
import { runMigrations } from '../services/db/sqlite';
import { syncOutbox } from '../services/firestore';
import { ensureNotificationPermissions, scheduleStreakReminder } from '../services/notifications';

import { ThemeProvider } from '../theme/ThemeProvider';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    void runMigrations();
    void registerBackgroundSync();
    void (async () => {
      await ensureNotificationPermissions();
      await scheduleStreakReminder();
    })();
    const unsubAuth = onAuthChange((u) => setUser(u));
    const timeout = setTimeout(() => {
      if (useAuthStore.getState().user === undefined) setUser(null);
    }, 1200);
    const unsubNet = NetInfo.addEventListener((s) => {
      if (s.isConnected) void syncOutbox();
    });
    return () => {
      clearTimeout(timeout);
      unsubAuth();
      unsubNet();
    };
  }, [setUser]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Slot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
