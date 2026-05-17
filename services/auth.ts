import {
  type User,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { getFirebaseApp } from './firebase';

function getAuthInstance() {
  const app = getFirebaseApp();
  if (!app) throw new Error('Firebase not configured');
  return getAuth(app);
}

export function onAuthChange(cb: (u: User | null) => void) {
  try {
    const auth = getAuthInstance();
    return onAuthStateChanged(auth, cb);
  } catch {
    cb(null);
    return () => {};
  }
}

export async function signInEmail(email: string, password: string) {
  const auth = getAuthInstance();
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function registerEmail(email: string, password: string) {
  const auth = getAuthInstance();
  return createUserWithEmailAndPassword(auth, email.trim(), password);
}

/** Signs out Firebase when configured; no-op if Firebase is missing or user was only on Quick join. */
export async function signOutUser() {
  const app = getFirebaseApp();
  if (!app) return;
  try {
    const auth = getAuth(app);
    await fbSignOut(auth);
  } catch {
    // ignore
  }
}
