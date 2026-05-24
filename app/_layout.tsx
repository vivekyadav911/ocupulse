import 'react-native-gesture-handler';
import { registerBackgroundSync } from '../services/tasks';

import NetInfo from '@react-native-community/netinfo';
import { Slot } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthChange } from '../services/auth';
import { runMigrations } from '../services/db/sqlite';
import { hydrateProfileFromCloud } from '../services/profiles';
import { syncAll } from '../services/sync';
import { ensureNotificationPermissions, scheduleStreakReminder } from '../services/notifications';

import { ThemeProvider } from '../theme/ThemeProvider';
import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';

async function applyProfileForUser(uid: string, isAnonymous: boolean) {
  const hydrated = await hydrateProfileFromCloud(uid);
  if (hydrated.profileReady) {
    useSessionStore.getState().setTeam({
      profileReady: true,
      teamId: hydrated.teamId ?? null,
      studentId: hydrated.studentId ?? null,
      teamName: hydrated.teamName ?? useSessionStore.getState().teamName,
      studentFirstName: hydrated.studentFirstName ?? useSessionStore.getState().studentFirstName,
    });
    return;
  }
  if (!isAnonymous) {
    useSessionStore.getState().setTeam({ profileReady: true });
  }
}

export default function RootLayout() {
  const setUser = useAuthStore((s) => s.setUser);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    let unsubAuth = () => {};
    let unsubNet = () => {};
    let timeout: ReturnType<typeof setTimeout> | undefined;

    void (async () => {
      if (Platform.OS !== 'web') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
      await runMigrations();
      setDbReady(true);
      await registerBackgroundSync();
      await ensureNotificationPermissions();
      await scheduleStreakReminder();

      unsubAuth = onAuthChange((u) => {
        setUser(u);
        if (u) {
          void applyProfileForUser(u.uid, u.isAnonymous);
          void syncAll();
        } else {
          useSessionStore.getState().resetProfile();
        }
      });

      timeout = setTimeout(() => {
        if (useAuthStore.getState().user === undefined) setUser(null);
      }, 1200);

      unsubNet = NetInfo.addEventListener((s) => {
        if (s.isConnected) void syncAll();
      });
    })();

    return () => {
      if (timeout) clearTimeout(timeout);
      unsubAuth();
      unsubNet();
    };
  }, [setUser]);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Slot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
