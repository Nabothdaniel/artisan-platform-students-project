import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

type ExtraFirebaseConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
};

function getExpoExtraFirebaseConfig(): ExtraFirebaseConfig {
  try {
    // Dynamically require expo-constants so standalone Node scripts (npm run seed) work seamlessly
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants').default;
    return Constants?.expoConfig?.extra?.firebase || {};
  } catch {
    return {};
  }
}

const extraConfig = getExpoExtraFirebaseConfig();

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyC72BfxKvn_iy-3h8L_jQ4-9Gz9uLUg01M',
  authDomain: 'artisan-students-project.firebaseapp.com',
  projectId: 'artisan-students-project',
  storageBucket: 'artisan-students-project.firebasestorage.app',
  messagingSenderId: '107534628213',
  appId: '1:107534628213:web:98a97086b27cfb8e444f3c',
  measurementId: 'G-C1ZVDEJQ88',
};

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || extraConfig.apiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || extraConfig.authDomain || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || extraConfig.projectId || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || extraConfig.storageBucket || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || extraConfig.messagingSenderId || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || extraConfig.appId || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || extraConfig.measurementId || DEFAULT_FIREBASE_CONFIG.measurementId,
};

const PLACEHOLDER_VALUES = new Set([
  '',
  'your-api-key',
  'your-project-id',
  'YOUR_API_KEY',
  'YOUR_PROJECT_ID',
  'demo-artisanhub',
]);

export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    !PLACEHOLDER_VALUES.has(firebaseConfig.apiKey) &&
    !PLACEHOLDER_VALUES.has(firebaseConfig.projectId)
);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let seederAuthInstance: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    const existing = getApps().find(a => a.name === '[DEFAULT]');
    appInstance = existing || initializeApp(firebaseConfig);
  }
  return appInstance;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}

export function getFirebaseDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
  }
  return dbInstance;
}

/**
 * Uses a secondary FirebaseApp instance so seeding Auth accounts with
 * createUserWithEmailAndPassword does not overwrite the primary user session.
 */
export function getSeederAuth(): Auth {
  if (!seederAuthInstance) {
    const existing = getApps().find(a => a.name === 'ArtisanHubSeeder');
    const seederApp = existing || initializeApp(firebaseConfig, 'ArtisanHubSeeder');
    seederAuthInstance = getAuth(seederApp);
  }
  return seederAuthInstance;
}
