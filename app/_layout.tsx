import 'react-native-gesture-handler';
import '../services/tasks';

import NetInfo from '@react-native-community/netinfo';
import { Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { onAuthChange } from '../services/auth';
import { runMigrations } from '../services/db/sqlite';
import { registerBackgroundSync } from '../services/tasks';
import { syncOutbox } from '../services/firestore';
import { ensureNotificationPermissions, scheduleStreakReminder } from '../services/notifications';

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

  return <Stack screenOptions={{ headerShown: false }} />;
}
