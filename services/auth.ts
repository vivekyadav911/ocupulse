import {
  type User,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
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

export async function signInAnon() {
  const auth = getAuthInstance();
  return signInAnonymously(auth);
}

export async function signInEmail(email: string, password: string) {
  const auth = getAuthInstance();
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function registerEmail(email: string, password: string) {
  const auth = getAuthInstance();
  return createUserWithEmailAndPassword(auth, email.trim(), password);
}

export async function signOutUser() {
  const auth = getAuthInstance();
  await fbSignOut(auth);
}
