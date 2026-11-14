import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirebaseDb,
  getSeederAuth,
  isFirebaseConfigured,
} from './firebase';
import {
  SEED_AUDIT_LOGS,
  SEED_BIDS,
  SEED_BOOKINGS,
  SEED_KYC_VERIFICATIONS,
  SEED_REVIEWS,
  SEED_SKILLS,
  SEED_USERS,
} from './seedData';

export const COLLECTIONS = {
  USERS: 'users',
  SKILLS: 'skills',
  KYC: 'kyc_verifications',
  BOOKINGS: 'bookings',
  BIDS: 'bids',
  REVIEWS: 'reviews',
  AUDIT_LOGS: 'audit_logs',
  COUNTERS: 'counters',
} as const;

let activeSeedPromise: Promise<{ seeded: boolean; reason?: string }> | null = null;
let firestoreAvailable = true;

export function isFirestoreAvailable(): boolean {
  return isFirebaseConfigured && firestoreAvailable;
}

export function markFirestoreUnavailable(): void {
  console.warn('[ArtisanHub] Firestore marked UNAVAILABLE, falling back to local store.\n' + new Error().stack);
  firestoreAvailable = false;
}

/**
 * Ensures Firebase Auth accounts exist for the 6 seeded demo users using
 * the isolated secondary Auth instance, and returns a map of user.id -> uid.
 */
async function seedFirebaseAuthUsers(): Promise<Map<number, string>> {
  const seederAuth = getSeederAuth();
  const uidMap = new Map<number, string>();

  for (const seedUser of SEED_USERS) {
    const password = seedUser.password || 'password123';
    try {
      const cred = await createUserWithEmailAndPassword(seederAuth, seedUser.email, password);
      uidMap.set(seedUser.id, cred.user.uid);
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        try {
          const cred = await signInWithEmailAndPassword(seederAuth, seedUser.email, password);
          uidMap.set(seedUser.id, cred.user.uid);
        } catch {
          // Ignore if user changed password
        }
      }
    }
  }

  return uidMap;
}

/**
 * Idempotently seeds Cloud Firestore (and Firebase Auth demo accounts) with
 * ArtisanHub baseline skills, quizzes, users, artisan profiles, KYC records,
 * bookings, bids, reviews, and audit logs.
 */
export async function ensureDatabaseSeeded(options?: {
  force?: boolean;
  seedAuth?: boolean;
}): Promise<{ seeded: boolean; reason?: string }> {
  if (!isFirebaseConfigured) {
    return { seeded: false, reason: 'firebase_not_configured' };
  }

  if (!firestoreAvailable && !options?.force) {
    return { seeded: false, reason: 'firestore_rules_locked' };
  }

  if (activeSeedPromise && !options?.force) {
    return activeSeedPromise;
  }

  activeSeedPromise = (async () => {
    try {
      const db = getFirebaseDb();
      const seederAuth = getSeederAuth();

      if (!options?.force) {
        try {
          const [adminSnap, skillSnap] = await Promise.all([
            getDoc(doc(db, COLLECTIONS.USERS, '1')),
            getDoc(doc(db, COLLECTIONS.SKILLS, '1')),
          ]);

          if (adminSnap.exists() && skillSnap.exists()) {
            firestoreAvailable = true;
            return { seeded: false, reason: 'already_seeded' };
          }
        } catch (err: any) {
          console.warn('[ArtisanHub] seed check read failed:', err?.code, err?.message);
          // If rules require auth for reads, authenticate below and retry
        }
      }

      // Authenticate on the secondary seeder app first so Firestore rules requiring `request.auth != null` pass
      try {
        await signInWithEmailAndPassword(
          seederAuth,
          SEED_USERS[0].email,
          SEED_USERS[0].password || 'password123'
        );
      } catch {
        // Ignore if not yet created
      }

      if (!options?.force) {
        const [adminSnap, skillSnap] = await Promise.all([
          getDoc(doc(db, COLLECTIONS.USERS, '1')),
          getDoc(doc(db, COLLECTIONS.SKILLS, '1')),
        ]);

        if (adminSnap.exists() && skillSnap.exists()) {
          firestoreAvailable = true;
          return { seeded: false, reason: 'already_seeded' };
        }
      }

      console.log('Seeding ArtisanHub Firebase Firestore database...');
      const uidMap = options?.seedAuth !== false ? await seedFirebaseAuthUsers() : new Map<number, string>();

      const batch = writeBatch(db);

      // 1. Skills & Assessment Questions
      for (const skill of SEED_SKILLS) {
        batch.set(doc(db, COLLECTIONS.SKILLS, String(skill.id)), skill);
      }

      // 2. Users & Artisan Profiles
      for (const user of SEED_USERS) {
        const uid = uidMap.get(user.id);
        batch.set(
          doc(db, COLLECTIONS.USERS, String(user.id)),
          uid ? { ...user, uid } : user
        );
      }

      // 3. KYC Verifications
      for (const kyc of SEED_KYC_VERIFICATIONS) {
        batch.set(doc(db, COLLECTIONS.KYC, String(kyc.id)), kyc);
      }

      // 4. Bookings
      for (const booking of SEED_BOOKINGS) {
        batch.set(doc(db, COLLECTIONS.BOOKINGS, String(booking.id)), booking);
      }

      // 5. Bids
      for (const bid of SEED_BIDS) {
        batch.set(doc(db, COLLECTIONS.BIDS, String(bid.id)), bid);
      }

      // 6. Reviews
      for (const review of SEED_REVIEWS) {
        batch.set(doc(db, COLLECTIONS.REVIEWS, String(review.id)), review);
      }

      // 7. Audit Logs
      for (const log of SEED_AUDIT_LOGS) {
        batch.set(doc(db, COLLECTIONS.AUDIT_LOGS, String(log.id)), log);
      }

      // 8. Sequence Counters
      batch.set(doc(db, COLLECTIONS.COUNTERS, 'sequences'), {
        users: SEED_USERS.length,
        artisan_profiles: 3,
        skills: SEED_SKILLS.length,
        kyc_verifications: SEED_KYC_VERIFICATIONS.length,
        bookings: SEED_BOOKINGS.length,
        bids: SEED_BIDS.length,
        reviews: SEED_REVIEWS.length,
        audit_logs: SEED_AUDIT_LOGS.length,
        updated_at: new Date().toISOString(),
      });

      await batch.commit();

      try {
        await signOut(seederAuth);
      } catch {
        // Ignore
      }

      firestoreAvailable = true;
      console.log('ArtisanHub Firebase database seeded successfully!');
      return { seeded: true };
    } catch (error: any) {
      if (error?.code === 'permission-denied' || error?.code === 'not-found') {
        firestoreAvailable = false;
        console.warn(
          'Cloud Firestore rules currently block client access (permission-denied). ' +
            'Update Firestore Rules in Firebase Console using `firestore.rules` to enable live Firestore reads/writes. ' +
            'Using Firebase Auth + seeded local state in the meantime.'
        );
        return { seeded: false, reason: 'permission-denied' };
      }
      console.warn('Error seeding Firebase database:', error);
      return { seeded: false, reason: error?.message || 'seed_error' };
    } finally {
      activeSeedPromise = null;
    }
  })();

  return activeSeedPromise;
}
