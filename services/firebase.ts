import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError } from 'firebase/app';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from '@firebase/auth';
import {
  getFirebaseConfigDebug,
  isFirebaseConfigured,
  readFirebaseConfig,
} from '../lib/firebaseConfig';

export { isFirebaseConfigured, getFirebaseConfigDebug };

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let initError: string | null = null;

function isAuthAlreadyInitializedError(e: unknown): boolean {
  if (e instanceof FirebaseError) {
    return e.code === 'auth/already-initialized';
  }
  const message = e instanceof Error ? e.message : String(e);
  return message.includes('already-initialized') || message.includes('already initialized');
}

function initAuth(firebaseApp: FirebaseApp): Auth {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }

  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    if (isAuthAlreadyInitializedError(e)) {
      return getAuth(firebaseApp);
    }
    throw e;
  }
}

function initFirebase(): void {
  initError = null;
  const cfg = readFirebaseConfig();
  if (!cfg) {
    initError = 'Firebase keys missing. Add FIREBASE_* to .env and restart with: npx expo start -c';
    if (__DEV__) {
      console.warn('[Ocupulse]', initError, getFirebaseConfigDebug());
    }
    return;
  }

  if (app && auth && db) return;

  try {
    app = getApps().length ? getApps()[0]! : initializeApp(cfg);
    auth = auth ?? initAuth(app);
    db = db ?? getFirestore(app);
  } catch (e) {
    if (!auth && app && isAuthAlreadyInitializedError(e)) {
      auth = getAuth(app);
      db = db ?? getFirestore(app);
      return;
    }
    initError = e instanceof Error ? e.message : 'Firebase initialization failed';
    console.error('[Ocupulse] Firebase init failed:', e);
  }
}

export function getFirebaseApp(): FirebaseApp | null {
  initFirebase();
  return app;
}

export function getFirebaseAuth(): Auth {
  initFirebase();
  if (!auth) {
    throw new Error(initError ?? 'Firebase not configured');
  }
  return auth;
}

export function getFirestoreDb(): Firestore | null {
  initFirebase();
  return db;
}
