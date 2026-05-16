import 'react-native-gesture-handler';
import { registerBackgroundSync } from '../services/tasks';

import NetInfo from '@react-native-community/netinfo';
import { Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { onAuthChange } from '../services/auth';
import { runMigrations } from '../services/db/sqlite';
import { syncOutbox } from '../services/firestore';
import { ensureNotificationPermissions, scheduleStreakReminder } from '../services/notifications';

import { ThemeProvider } from '../theme/ThemeProvider';
import { useAppTheme } from '../theme/useAppTheme';
import { useAuthStore } from '../store/authStore';

function RootNavigator() {
  const { colors } = useAppTheme();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surfaceAlt } }}
    />
  );
}

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
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
