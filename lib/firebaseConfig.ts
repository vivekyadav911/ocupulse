import Constants from 'expo-constants';

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
};

type ExtraRecord = Record<string, unknown>;

function readConstantsExtra(): ExtraRecord {
  const constants = Constants as {
    expoConfig?: { extra?: ExtraRecord } | null;
    manifest?: { extra?: ExtraRecord } | null;
    manifest2?: { extra?: ExtraRecord } | null;
  };

  const candidates = [
    constants.expoConfig?.extra,
    constants.manifest2?.extra,
    constants.manifest?.extra,
  ];

  for (const extra of candidates) {
    if (extra && typeof extra === 'object' && Object.keys(extra).length > 0) {
      return extra;
    }
  }

  return {};
}

function readPublicEnv(): Partial<FirebaseWebConfig> {
  return {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

/** Resolve Firebase web config from Expo `extra` and `EXPO_PUBLIC_*` env fallbacks. */
export function readFirebaseConfig(): FirebaseWebConfig | null {
  const extra = readConstantsExtra();
  const env = readPublicEnv();

  const apiKey = pickString(extra.firebaseApiKey, env.apiKey);
  const projectId = pickString(extra.firebaseProjectId, env.projectId);
  const appId = pickString(extra.firebaseAppId, env.appId);
  let authDomain = pickString(extra.firebaseAuthDomain, env.authDomain);
  const storageBucket = pickString(extra.firebaseStorageBucket, env.storageBucket);
  const messagingSenderId = pickString(extra.firebaseMessagingSenderId, env.messagingSenderId);

  if (!apiKey || !projectId || !appId) {
    return null;
  }

  if (!authDomain) {
    authDomain = `${projectId}.firebaseapp.com`;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    ...(storageBucket ? { storageBucket } : {}),
    ...(messagingSenderId ? { messagingSenderId } : {}),
  };
}

export function isFirebaseConfigured(): boolean {
  return readFirebaseConfig() !== null;
}

export function getFirebaseConfigDebug(): {
  configured: boolean;
  sources: { extra: boolean; publicEnv: boolean };
} {
  const extra = readConstantsExtra();
  const env = readPublicEnv();
  return {
    configured: isFirebaseConfigured(),
    sources: {
      extra: Boolean(extra.firebaseApiKey || extra.firebaseProjectId || extra.firebaseAppId),
      publicEnv: Boolean(env.apiKey || env.projectId || env.appId),
    },
  };
}
