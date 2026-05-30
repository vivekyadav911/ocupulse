import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { registerBackgroundSync } from '../services/tasks';

import NetInfo from '@react-native-community/netinfo';
import { Slot } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthChange } from '../services/auth';
import { runMigrations } from '../services/db/sqlite';
import { applySessionFromProfile } from '../lib/applySessionFromProfile';
import { hydrateProfileFromCloud } from '../services/profiles';
import { syncAll } from '../services/sync';
import { clearStaleOutboxRows } from '../services/firestore';
import { ensureNotificationPermissions, scheduleStreakReminder } from '../services/notifications';

import { SessionActivityGuard } from '../components/SessionActivityGuard';
import { ThemeProvider } from '../theme/ThemeProvider';
import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';

async function applyProfileForUser(uid: string) {
  const { setProfileHydrated } = useAuthStore.getState();
  setProfileHydrated(false);
  try {
    const hydrated = await hydrateProfileFromCloud(uid);
    if (hydrated.role) {
      applySessionFromProfile(hydrated);
    } else {
      useSessionStore.getState().setTeam({ profileReady: hydrated.profileReady });
    }
  } catch (e) {
    console.warn('[Ocupulse] profile hydration failed', e);
    useSessionStore.getState().setTeam({ profileReady: false });
  } finally {
    setProfileHydrated(true);
  }
}

export default function RootLayout() {
  const setUser = useAuthStore((s) => s.setUser);
  const setProfileHydrated = useAuthStore((s) => s.setProfileHydrated);
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
          void applyProfileForUser(u.uid).then(async () => {
            await clearStaleOutboxRows();
            await syncAll();
          });
        } else {
          useSessionStore.getState().resetProfile();
          setProfileHydrated(true);
        }
      });

      timeout = setTimeout(() => {
        const auth = useAuthStore.getState();
        if (auth.user === undefined) {
          auth.setUser(null);
          auth.setProfileHydrated(true);
        }
      }, 1500);

      unsubNet = NetInfo.addEventListener((s) => {
        if (!s.isConnected) return;
        const { user, profileHydrated } = useAuthStore.getState();
        if (user && profileHydrated) void syncAll();
      });
    })();

    return () => {
      if (timeout) clearTimeout(timeout);
      unsubAuth();
      unsubNet();
    };
  }, [setUser, setProfileHydrated]);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SessionActivityGuard>
            <Slot />
          </SessionActivityGuard>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
