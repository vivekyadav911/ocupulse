import {
  type User,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile, UserRole } from './db/types';
import { getFirebaseApp, getFirestoreDb, isFirebaseConfigured } from './firebase';

function getAuthInstance() {
  const app = getFirebaseApp();
  if (!app) throw new Error('Firebase not configured');
  return getAuth(app);
}

export function onAuthChange(cb: (u: User | null) => void) {
  if (!isFirebaseConfigured()) {
    cb(null);
    return () => {};
  }
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

export async function registerEmail(email: string, password: string, displayName?: string) {
  const auth = getAuthInstance();
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName?.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  await createUserProfile(cred.user.uid, {
    role: 'teacher',
    displayName: displayName?.trim() || email.split('@')[0] || 'Teacher',
    email: email.trim(),
  });
  return cred;
}

export async function signInAnonymousStudent() {
  const auth = getAuthInstance();
  const cred = await signInAnonymously(auth);
  return cred;
}

export async function createUserProfile(
  uid: string,
  input: {
    role: UserRole;
    displayName: string;
    email?: string;
    teamId?: string;
    studentId?: string;
  },
): Promise<UserProfile> {
  const db = getFirestoreDb();
  const now = Date.now();
  const profile: UserProfile = {
    uid,
    role: input.role,
    displayName: input.displayName,
    email: input.email,
    teamId: input.teamId,
    studentId: input.studentId,
    createdAt: now,
    updatedAt: now,
  };
  if (db) {
    await setDoc(doc(db, 'users', uid), profile, { merge: true });
  }
  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function updateUserProfile(uid: string, patch: Partial<UserProfile>): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await setDoc(doc(db, 'users', uid), { ...patch, updatedAt: Date.now() }, { merge: true });
}

/** Signs out Firebase when configured; no-op if Firebase is missing. */
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

export function getCurrentUser(): User | null {
  try {
    return getAuthInstance().currentUser;
  } catch {
    return null;
  }
}
