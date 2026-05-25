import {
  type User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import { deleteField, doc, getDoc, setDoc } from 'firebase/firestore';
import { withoutUndefined } from '../lib/firestoreSanitize';
import type { UserProfile, UserRole } from './db/types';
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from './firebase';

function getAuthInstance() {
  return getFirebaseAuth();
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

export async function signInAnonymousStudent() {
  const auth = getAuthInstance();
  const cred = await signInAnonymously(auth);
  const existing = await getUserProfile(cred.user.uid);
  if (!existing) {
    await createUserProfile(cred.user.uid, {
      role: 'student',
      displayName: 'Student',
      profileReady: false,
    });
  }
  return cred;
}

export async function registerTeacherEmail(email: string, password: string, displayName?: string) {
  const auth = getAuthInstance();
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const name = displayName?.trim() || email.split('@')[0] || 'Teacher';
  if (displayName?.trim()) {
    await updateProfile(cred.user, { displayName: name });
  }
  await createUserProfile(cred.user.uid, {
    role: 'teacher',
    displayName: name,
    email: email.trim(),
    profileReady: false,
  });
  return cred;
}

export async function registerStudentEmail(email: string, password: string) {
  const auth = getAuthInstance();
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await createUserProfile(cred.user.uid, {
    role: 'student',
    displayName: email.split('@')[0] || 'Student',
    email: email.trim(),
    profileReady: false,
  });
  return cred;
}

/** @deprecated Use registerTeacherEmail */
export async function registerEmail(email: string, password: string, displayName?: string) {
  return registerTeacherEmail(email, password, displayName);
}

export async function createUserProfile(
  uid: string,
  input: {
    role: UserRole;
    displayName: string;
    email?: string;
    teamId?: string;
    studentId?: string;
    managedTeamIds?: string[];
    profileReady?: boolean;
  },
): Promise<UserProfile> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available. Check Firebase configuration in .env.');
  }
  const now = Date.now();
  const existing = await getDoc(doc(db, 'users', uid));
  const createdAt = existing.exists() ? Number(existing.data()?.createdAt ?? now) : now;

  const profile: UserProfile = {
    uid,
    role: input.role,
    displayName: input.displayName,
    email: input.email,
    teamId: input.teamId,
    studentId: input.studentId,
    managedTeamIds: input.managedTeamIds,
    profileReady: input.profileReady ?? false,
    createdAt,
    updatedAt: now,
  };

  const patch: Record<string, unknown> = { ...profile };
  if (input.role === 'teacher') {
    patch.teamId = input.teamId ?? deleteField();
    patch.studentId = input.studentId ?? deleteField();
    if (!input.managedTeamIds) patch.managedTeamIds = deleteField();
  } else {
    patch.managedTeamIds = input.managedTeamIds ?? deleteField();
  }

  await setDoc(doc(db, 'users', uid), withoutUndefined(patch), { merge: true });
  return profile;
}

/** Student shell → teacher (never completed student setup). */
export async function convertIncompleteStudentToTeacher(
  uid: string,
  displayName?: string,
): Promise<UserProfile> {
  const name = displayName?.trim() || 'Teacher';
  await updateUserProfile(uid, {
    role: 'teacher',
    displayName: name,
    profileReady: false,
    teamId: deleteField(),
    studentId: deleteField(),
    managedTeamIds: deleteField(),
  });
  const profile = await getUserProfile(uid);
  if (!profile) throw new Error('Could not update profile.');
  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  const profile = await getUserProfile(uid);
  return profile?.role ?? null;
}

export async function updateUserProfile(uid: string, patch: Partial<UserProfile>): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  await setDoc(doc(db, 'users', uid), withoutUndefined({ ...patch, updatedAt: Date.now() }), {
    merge: true,
  });
}

export async function signOutUser() {
  try {
    const auth = getAuthInstance();
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

export function routeAfterAuth(
  profile: UserProfile,
): '/(tabs)' | '/(auth)/student-setup' | '/(auth)/teacher-setup' {
  if (!profile.profileReady) {
    return profile.role === 'teacher' ? '/(auth)/teacher-setup' : '/(auth)/student-setup';
  }
  return '/(tabs)';
}
