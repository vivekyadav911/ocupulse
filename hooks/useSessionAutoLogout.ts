import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import {
  SESSION_INACTIVITY_MS,
  clearSessionGuardState,
  markSessionBackgrounded,
  performSessionAutoLogout,
  wasKilledFromRecents,
} from '../lib/sessionAutoLogout';
import { useAuthStore } from '../store/authStore';

function isSignedIn(
  user: ReturnType<typeof useAuthStore.getState>['user'],
): user is NonNullable<typeof user> {
  return user != null;
}

/**
 * Auto sign-out:
 * - 5 minutes with no touch/scroll while the app is open
 * - 5 minutes after the app goes to background but stays in recents
 * - Immediately on next launch if the app was removed from recents (killed in background)
 */
export function useSessionAutoLogout() {
  const user = useAuthStore((s) => s.user);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const signedInRef = useRef(false);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const clearBackgroundTimer = useCallback(() => {
    if (backgroundTimerRef.current) {
      clearTimeout(backgroundTimerRef.current);
      backgroundTimerRef.current = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    clearInactivityTimer();
    clearBackgroundTimer();
  }, [clearBackgroundTimer, clearInactivityTimer]);

  const scheduleInactivityLogout = useCallback(() => {
    clearInactivityTimer();
    if (!signedInRef.current || appStateRef.current !== 'active') return;
    inactivityTimerRef.current = setTimeout(() => {
      void performSessionAutoLogout('inactivity');
    }, SESSION_INACTIVITY_MS);
  }, [clearInactivityTimer]);

  const scheduleBackgroundLogout = useCallback(() => {
    clearBackgroundTimer();
    if (!signedInRef.current) return;
    backgroundTimerRef.current = setTimeout(() => {
      void performSessionAutoLogout('background-timeout');
    }, SESSION_INACTIVITY_MS);
  }, [clearBackgroundTimer]);

  const onUserActivity = useCallback(() => {
    if (!signedInRef.current || appStateRef.current !== 'active') return;
    scheduleInactivityLogout();
  }, [scheduleInactivityLogout]);

  const handleForeground = useCallback(async () => {
    clearBackgroundTimer();
    await clearSessionGuardState();
    scheduleInactivityLogout();
  }, [clearBackgroundTimer, scheduleInactivityLogout]);

  const handleBackground = useCallback(async () => {
    clearInactivityTimer();
    if (!signedInRef.current) return;
    await markSessionBackgrounded();
    scheduleBackgroundLogout();
  }, [clearInactivityTimer, scheduleBackgroundLogout]);

  useEffect(() => {
    signedInRef.current = isSignedIn(user);
    if (!isSignedIn(user)) {
      clearAllTimers();
      return;
    }
    scheduleInactivityLogout();
    return clearAllTimers;
  }, [user, clearAllTimers, scheduleInactivityLogout]);

  useEffect(() => {
    void (async () => {
      if (await wasKilledFromRecents()) {
        await performSessionAutoLogout('killed-from-recents');
      }
    })();
  }, []);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      if (next === 'active') {
        void handleForeground();
        return;
      }

      if (next === 'background') {
        void handleBackground();
      }
    };

    const sub = AppState.addEventListener('change', onChange);

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const onVisibility = () => {
        if (document.visibilityState === 'visible') {
          appStateRef.current = 'active';
          void handleForeground();
        } else {
          appStateRef.current = 'background';
          void handleBackground();
        }
      };
      document.addEventListener('visibilitychange', onVisibility);
      return () => {
        sub.remove();
        document.removeEventListener('visibilitychange', onVisibility);
        clearAllTimers();
      };
    }

    return () => {
      sub.remove();
      clearAllTimers();
    };
  }, [clearAllTimers, handleBackground, handleForeground]);

  return { onUserActivity };
}
