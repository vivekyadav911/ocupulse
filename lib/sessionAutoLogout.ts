import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOutUser } from '../services/auth';

/** Sign out after this long with no interaction (foreground) or in background (recents). */
export const SESSION_INACTIVITY_MS = 5 * 60 * 1000;

const STORAGE_KEY = '@ocupulse/session-guard';

export type SessionGuardPersisted = {
  inBackground: boolean;
  backgroundAt: number;
};

let logoutInFlight = false;

export async function readSessionGuardState(): Promise<SessionGuardPersisted | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionGuardPersisted;
    if (!parsed.inBackground || typeof parsed.backgroundAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function markSessionBackgrounded(): Promise<void> {
  const payload: SessionGuardPersisted = {
    inBackground: true,
    backgroundAt: Date.now(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function clearSessionGuardState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** App was backgrounded and relaunched without returning to foreground (swiped from recents). */
export async function wasKilledFromRecents(): Promise<boolean> {
  const state = await readSessionGuardState();
  return state?.inBackground === true;
}

export async function performSessionAutoLogout(reason: string): Promise<void> {
  if (logoutInFlight) return;
  logoutInFlight = true;
  try {
    if (__DEV__) console.log('[Ocupulse] auto logout:', reason);
    await clearSessionGuardState();
    await signOutUser();
  } finally {
    logoutInFlight = false;
  }
}
