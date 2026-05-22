import Constants from 'expo-constants';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

function readExtra() {
  const extra = Constants.expoConfig?.extra ?? {};
  return {
    apiKey: String(extra.firebaseApiKey ?? ''),
    authDomain: String(extra.firebaseAuthDomain ?? ''),
    projectId: String(extra.firebaseProjectId ?? ''),
    storageBucket: String(extra.firebaseStorageBucket ?? ''),
    messagingSenderId: String(extra.firebaseMessagingSenderId ?? ''),
    appId: String(extra.firebaseAppId ?? ''),
  };
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function isFirebaseConfigured(): boolean {
  const cfg = readExtra();
  return Boolean(cfg.apiKey && cfg.projectId);
}

export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;
  const cfg = readExtra();
  if (!cfg.apiKey || !cfg.projectId) {
    console.warn('Ocupulse: Firebase extra keys missing — set .env / app.config.ts.');
    return null;
  }
  app = getApps().length ? getApps()[0]! : initializeApp(cfg);
  return app;
}

export function getFirestoreDb(): Firestore | null {
  if (db) return db;
  const a = getFirebaseApp();
  if (!a) return null;
  db = getFirestore(a);
  return db;
}
