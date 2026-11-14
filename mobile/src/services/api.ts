import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
} from './firebase';
import {
  COLLECTIONS,
  ensureDatabaseSeeded,
  isFirestoreAvailable,
  markFirestoreUnavailable,
} from './seed';
import {
  SEED_AUDIT_LOGS,
  SEED_BIDS,
  SEED_BOOKINGS,
  SEED_KYC_VERIFICATIONS,
  SEED_REVIEWS,
  SEED_SKILLS,
  SEED_USERS,
  SeedAuditLog,
  SeedBid,
  SeedBooking,
  SeedKYC,
  SeedReview,
  SeedSkill,
  SeedUser,
} from './seedData';

// Local in-memory seeded mirror used if Firebase credentials are not set or Firestore Rules are still in locked production mode
const localStore = {
  skills: SEED_SKILLS.map(s => ({ ...s, questions: s.questions.map(q => ({ ...q })) })),
  users: SEED_USERS.map(u => ({
    ...u,
    artisan_profile: u.artisan_profile ? { ...u.artisan_profile } : null,
  })),
  kyc: SEED_KYC_VERIFICATIONS.map(k => ({ ...k })),
  bookings: SEED_BOOKINGS.map(b => ({ ...b })),
  bids: SEED_BIDS.map(b => ({ ...b })),
  reviews: SEED_REVIEWS.map(r => ({ ...r })),
  auditLogs: SEED_AUDIT_LOGS.map(l => ({ ...l })),
};

function getLocalCollection(collectionName: string): any[] {
  switch (collectionName) {
    case COLLECTIONS.USERS:
      return localStore.users;
    case COLLECTIONS.SKILLS:
      return localStore.skills;
    case COLLECTIONS.KYC:
      return localStore.kyc;
    case COLLECTIONS.BOOKINGS:
      return localStore.bookings;
    case COLLECTIONS.BIDS:
      return localStore.bids;
    case COLLECTIONS.REVIEWS:
      return localStore.reviews;
    case COLLECTIONS.AUDIT_LOGS:
      return localStore.auditLogs;
    default:
      return [];
  }
}

function sanitizeUser(user: SeedUser): Omit<SeedUser, 'password'> {
  const { password: _password, ...rest } = user;
  return rest;
}

function encodeToken(userId: number, uid?: string): string {
  return `fb_user_${userId}${uid ? `_${uid}` : ''}`;
}

function decodeUserIdFromToken(token?: string): number | null {
  if (!token) return null;
  const match = token.match(/^fb_user_(\d+)/);
  if (match) return parseInt(match[1], 10);
  const num = Number(token);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function getLocalNextSequenceId(counterKey: string): number {
  const map: Record<string, any[]> = {
    users: localStore.users,
    artisan_profiles: localStore.users.map(u => u.artisan_profile).filter(Boolean),
    skills: localStore.skills,
    kyc_verifications: localStore.kyc,
    bookings: localStore.bookings,
    bids: localStore.bids,
    reviews: localStore.reviews,
    audit_logs: localStore.auditLogs,
  };
  const arr = map[counterKey] || [];
  const maxId = arr.reduce((max, item) => Math.max(max, Number(item?.id) || 0), 0);
  return maxId + 1;
}

async function ensureFirebaseAuthSession(user?: SeedUser | null): Promise<void> {
  if (!isFirebaseConfigured) return;
  const auth = getFirebaseAuth();
  if (auth.currentUser) return;
  const email = user?.email || SEED_USERS[0].email;
  const password = user?.password || 'password123';
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch {
    // Ignore if custom password not in local seed
  }
}

async function getNextSequenceId(counterKey: string, fallbackCollectionName: string): Promise<number> {
  if (!isFirestoreAvailable()) {
    return getLocalNextSequenceId(counterKey);
  }

  await ensureFirebaseAuthSession();
  const db = getFirebaseDb();
  const counterRef = doc(db, COLLECTIONS.COUNTERS, 'sequences');

  try {
    const nextId = await runTransaction(db, async transaction => {
      const snap = await transaction.get(counterRef);
      const data = snap.exists() ? snap.data() : {};
      const current = Number(data[counterKey]) || 0;
      const updated = current + 1;
      transaction.set(
        counterRef,
        { ...data, [counterKey]: updated, updated_at: new Date().toISOString() },
        { merge: true }
      );
      return updated;
    });
    return nextId;
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      markFirestoreUnavailable();
      return getLocalNextSequenceId(counterKey);
    }
    try {
      const snap = await getDocs(collection(db, fallbackCollectionName));
      let maxId = 0;
      snap.forEach(d => {
        const id = Number(d.data()?.id || d.id);
        if (Number.isFinite(id) && id > maxId) maxId = id;
      });
      return maxId + 1;
    } catch {
      markFirestoreUnavailable();
      return getLocalNextSequenceId(counterKey);
    }
  }
}

async function logAuditAction(userId: number | null, action: string, details: string): Promise<void> {
  const timestamp = new Date().toISOString();
  const id = await getNextSequenceId('audit_logs', COLLECTIONS.AUDIT_LOGS);
  const entry: SeedAuditLog = { id, user_id: userId, action, details, timestamp };

  localStore.auditLogs.push(entry);
  if (!isFirestoreAvailable()) {
    return;
  }

  try {
    const db = getFirebaseDb();
    await setDoc(doc(db, COLLECTIONS.AUDIT_LOGS, String(id)), entry);
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      markFirestoreUnavailable();
    }
  }
}

async function fetchAllFromCollection<T>(collectionName: string): Promise<T[]> {
  if (!isFirestoreAvailable()) {
    return getLocalCollection(collectionName) as T[];
  }
  try {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    snap.forEach(d => items.push(d.data() as T));
    return items;
  } catch (err: any) {
    console.warn(`[ArtisanHub] fetch ${collectionName} failed:`, err?.code, err?.message);
    if (err?.code === 'permission-denied' || err?.code === 'not-found') {
      markFirestoreUnavailable();
      return getLocalCollection(collectionName) as T[];
    }
    throw err;
  }
}

async function resolveUserByToken(token?: string): Promise<SeedUser | null> {
  await ensureDatabaseSeeded();
  const userId = decodeUserIdFromToken(token);

  if (!isFirestoreAvailable()) {
    if (userId) {
      return localStore.users.find(u => u.id === userId) || null;
    }
    return null;
  }

  const db = getFirebaseDb();
  if (userId) {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.USERS, String(userId)));
      if (snap.exists()) {
        return snap.data() as SeedUser;
      }
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        markFirestoreUnavailable();
        return localStore.users.find(u => u.id === userId) || null;
      }
    }
  }

  const auth = getFirebaseAuth();
  if (auth.currentUser?.email) {
    const users = await fetchAllFromCollection<SeedUser>(COLLECTIONS.USERS);
    const match = users.find(
      u => u.uid === auth.currentUser?.uid || u.email.toLowerCase() === auth.currentUser?.email?.toLowerCase()
    );
    if (match) return match;
  }

  return null;
}

async function requireUser(token?: string): Promise<SeedUser> {
  const user = await resolveUserByToken(token);
  if (!user) {
    throw new Error('Authentication required. Please log in.');
  }
  return user;
}

async function hydrateBookings(bookings: SeedBooking[]): Promise<any[]> {
  const [allBids, allReviews, allSkills, allUsers] = await Promise.all([
    fetchAllFromCollection<SeedBid>(COLLECTIONS.BIDS),
    fetchAllFromCollection<SeedReview>(COLLECTIONS.REVIEWS),
    fetchAllFromCollection<SeedSkill>(COLLECTIONS.SKILLS),
    fetchAllFromCollection<SeedUser>(COLLECTIONS.USERS),
  ]);

  const userMap = new Map(allUsers.map(u => [u.id, sanitizeUser(u)]));
  const skillMap = new Map(allSkills.map(s => [s.id, s]));

  return bookings
    .map(b => {
      const bookingBids = allBids
        .filter(bid => bid.booking_id === b.id)
        .sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime())
        .map(bid => ({
          ...bid,
          artisan: userMap.get(bid.artisan_id) || null,
        }));

      const review = allReviews.find(r => r.booking_id === b.id) || null;
      return {
        ...b,
        customer: userMap.get(b.customer_id) || null,
        skill: skillMap.get(b.skill_id) || null,
        bids: bookingBids,
        review: review
          ? {
              ...review,
              customer: userMap.get(review.customer_id) || null,
            }
          : null,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export const api = {
  // Manual or startup seeding trigger
  seedDatabase: (force = false) => ensureDatabaseSeeded({ force }),

  // Auth
  login: async (credentials: { email: string; password: string }) => {
    const normalizedEmail = credentials.email.trim().toLowerCase();
    const password = credentials.password;
    console.log('[ArtisanHub] login: start', { email: normalizedEmail, firebaseConfigured: isFirebaseConfigured, firestoreAvailable: isFirestoreAvailable() });
    try {
      const seedResult = await ensureDatabaseSeeded();
      console.log('[ArtisanHub] login: seed check result', seedResult);
    } catch (err: any) {
      console.error('[ArtisanHub] login: ensureDatabaseSeeded threw', err?.code, err?.message, err);
      throw err;
    }

    if (!isFirebaseConfigured) {
      const user = localStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
      if (!user || (user.password && user.password !== password)) {
        throw new Error('Incorrect email or password.');
      }
      await logAuditAction(user.id, 'USER_LOGIN', `User ${user.email} logged in.`);
      return {
        access_token: encodeToken(user.id, user.uid),
        token_type: 'bearer',
        role: user.role,
        user_id: user.id,
        name: user.name,
      };
    }

    const auth = getFirebaseAuth();
    const users = await fetchAllFromCollection<SeedUser>(COLLECTIONS.USERS);
    let targetUser = users.find(u => u.email.toLowerCase() === normalizedEmail) || null;
    console.log('[ArtisanHub] login: loaded users', { count: users.length, found: !!targetUser, firestoreAvailable: isFirestoreAvailable() });

    let firebaseUid: string | undefined = targetUser?.uid;

    try {
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      firebaseUid = cred.user.uid;
      console.log('[ArtisanHub] login: signIn ok', firebaseUid);
    } catch (signInErr: any) {
      console.warn('[ArtisanHub] signIn failed:', signInErr?.code, signInErr?.message);
      const infraCodes = ['auth/network-request-failed', 'auth/too-many-requests', 'auth/invalid-api-key'];
      if (infraCodes.includes(signInErr?.code)) {
        throw new Error(`Login failed (${signInErr.code}). Check your connection and Firebase config.`);
      }
      // If user is in seeded/Firestore store with matching password, provision Firebase Auth user
      if (targetUser && (!targetUser.password || targetUser.password === password)) {
        try {
          const created = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
          firebaseUid = created.user.uid;
        } catch (createErr: any) {
          console.warn('[ArtisanHub] login: createUser fallback failed:', createErr?.code, createErr?.message);
          const ignorableCodes = [
            'auth/configuration-not-found',
            'auth/operation-not-allowed',
            'auth/email-already-in-use',
          ];
          if (!ignorableCodes.includes(createErr?.code)) {
            throw new Error('Incorrect email or password.');
          }
        }
      } else {
        throw new Error('Incorrect email or password.');
      }
    }

    if (!targetUser) {
      const newId = await getNextSequenceId('users', COLLECTIONS.USERS);
      targetUser = {
        id: newId,
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        phone: '+2348000000000',
        role: 'customer',
        location_name: 'Keffi, Nasarawa State',
        latitude: 8.8471,
        longitude: 7.8732,
        created_at: new Date().toISOString(),
        uid: firebaseUid,
        artisan_profile: null,
      };
      localStore.users.push(targetUser);
      if (isFirestoreAvailable()) {
        try {
          const db = getFirebaseDb();
          await setDoc(doc(db, COLLECTIONS.USERS, String(newId)), targetUser);
        } catch {
          markFirestoreUnavailable();
        }
      }
    } else if (firebaseUid && targetUser.uid !== firebaseUid) {
      targetUser.uid = firebaseUid;
      if (isFirestoreAvailable()) {
        try {
          const db = getFirebaseDb();
          await setDoc(
            doc(db, COLLECTIONS.USERS, String(targetUser.id)),
            { uid: firebaseUid },
            { merge: true }
          );
        } catch {
          markFirestoreUnavailable();
        }
      }
    }

    await logAuditAction(targetUser.id, 'USER_LOGIN', `User ${targetUser.email} logged in.`);

    return {
      access_token: encodeToken(targetUser.id, firebaseUid),
      token_type: 'bearer',
      role: targetUser.role,
      user_id: targetUser.id,
      name: targetUser.name,
    };
  },

  register: async (userPayload: any) => {
    await ensureDatabaseSeeded();
    const normalizedEmail = String(userPayload.email || '').trim().toLowerCase();
    if (!normalizedEmail || !userPayload.password) {
      throw new Error('Email and password are required.');
    }

    const users = await fetchAllFromCollection<SeedUser>(COLLECTIONS.USERS);

    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('User with this email already exists.');
    }

    let firebaseUid: string | undefined;
    if (isFirebaseConfigured) {
      const auth = getFirebaseAuth();
      try {
        const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, userPayload.password);
        firebaseUid = cred.user.uid;
      } catch (err: any) {
        if (err?.code === 'auth/email-already-in-use') {
          throw new Error('User with this email already exists.');
        }
        if (err?.code === 'auth/weak-password') {
          throw new Error('Password should be at least 6 characters.');
        }
        if (
          err?.code !== 'auth/configuration-not-found' &&
          err?.code !== 'auth/operation-not-allowed'
        ) {
          throw new Error(err?.message || 'Registration failed.');
        }
      }
    }

    const userId = await getNextSequenceId('users', COLLECTIONS.USERS);
    const role: 'customer' | 'artisan' | 'admin' = userPayload.role || 'customer';

    let artisanProfile = null;
    if (role === 'artisan') {
      const profileId = await getNextSequenceId('artisan_profiles', COLLECTIONS.USERS);
      const tradeCategory = userPayload.trade_category || 'Plumbing';
      artisanProfile = {
        id: profileId,
        user_id: userId,
        bio: userPayload.bio || `Qualified artisan skilled in ${tradeCategory}`,
        trade_category: tradeCategory,
        hourly_rate: Number(userPayload.hourly_rate) || 2500.0,
        years_experience: Number(userPayload.years_experience) || 1,
        is_available: true,
        kyc_status: 'unsubmitted' as const,
        skill_test_status: 'pending' as const,
        nin_bvn_token: null,
        rating_avg: 0.0,
        rating_count: 0,
      };
    }

    const newUser: SeedUser = {
      id: userId,
      name: userPayload.name,
      email: normalizedEmail,
      phone: userPayload.phone || '+2348000000000',
      password: userPayload.password,
      role,
      location_name: userPayload.location_name || 'Keffi, Nasarawa State',
      latitude: userPayload.latitude ?? 8.8471,
      longitude: userPayload.longitude ?? 7.8732,
      created_at: new Date().toISOString(),
      ...(firebaseUid ? { uid: firebaseUid } : {}),
      artisan_profile: artisanProfile,
    };

    localStore.users.push(newUser);
    if (isFirestoreAvailable()) {
      try {
        const db = getFirebaseDb();
        await setDoc(doc(db, COLLECTIONS.USERS, String(userId)), newUser);
      } catch {
        markFirestoreUnavailable();
      }
    }

    await logAuditAction(userId, 'USER_REGISTER', `User ${newUser.name} (${newUser.role}) registered.`);
    return sanitizeUser(newUser);
  },

  getMe: async (token: string) => {
    const user = await requireUser(token);
    return sanitizeUser(user);
  },

  // Artisans
  getArtisans: async (params?: {
    trade_category?: string;
    verified_only?: boolean;
    search?: string;
    min_rating?: number;
  }) => {
    await ensureDatabaseSeeded();
    const allUsers = await fetchAllFromCollection<SeedUser>(COLLECTIONS.USERS);

    let artisans = allUsers.filter(u => u.role === 'artisan' && u.artisan_profile);

    if (params?.trade_category) {
      const cat = params.trade_category.toLowerCase();
      artisans = artisans.filter(u =>
        (u.artisan_profile?.trade_category || '').toLowerCase().includes(cat)
      );
    }

    if (params?.verified_only) {
      artisans = artisans.filter(
        u =>
          u.artisan_profile?.kyc_status === 'approved' &&
          u.artisan_profile?.skill_test_status === 'passed'
      );
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      artisans = artisans.filter(
        u =>
          u.name.toLowerCase().includes(q) ||
          (u.artisan_profile?.bio || '').toLowerCase().includes(q) ||
          (u.location_name || '').toLowerCase().includes(q) ||
          (u.artisan_profile?.trade_category || '').toLowerCase().includes(q)
      );
    }

    if (params?.min_rating !== undefined) {
      artisans = artisans.filter(
        u => (u.artisan_profile?.rating_avg || 0) >= (params.min_rating || 0)
      );
    }

    return artisans
      .sort((a, b) => a.id - b.id)
      .map(sanitizeUser);
  },

  getArtisanDetail: async (id: number) => {
    await ensureDatabaseSeeded();
    const allUsers = await fetchAllFromCollection<SeedUser>(COLLECTIONS.USERS);

    const artisan = allUsers.find(u => u.id === id && u.role === 'artisan');
    if (!artisan) {
      throw new Error('Artisan profile not found.');
    }
    return sanitizeUser(artisan);
  },

  // Skills & Quiz
  getSkills: async () => {
    await ensureDatabaseSeeded();
    const skills = await fetchAllFromCollection<SeedSkill>(COLLECTIONS.SKILLS);
    return skills.sort((a, b) => a.id - b.id);
  },

  submitQuiz: async (
    payload: { skill_id: number; answers: { question_id: number; selected_option: string }[] },
    token: string
  ) => {
    const currentUser = await requireUser(token);
    const skills = await api.getSkills();
    const skill = skills.find(s => s.id === payload.skill_id);
    if (!skill) {
      throw new Error('Skill category not found.');
    }

    const questions = skill.questions || [];
    if (questions.length === 0) {
      throw new Error('No assessment questions configured for this skill.');
    }

    const questionMap = new Map(questions.map(q => [q.id, q.correct_option.toUpperCase()]));
    let correctCount = 0;

    for (const ans of payload.answers) {
      const expected = questionMap.get(ans.question_id);
      if (expected && ans.selected_option.toUpperCase() === expected) {
        correctCount += 1;
      }
    }

    const totalQuestions = questions.length;
    const scorePct = totalQuestions > 0 ? (correctCount / totalQuestions) * 100.0 : 0.0;
    const passed = scorePct >= 70.0;
    const newStatus: 'passed' | 'failed' = passed ? 'passed' : 'failed';

    if (currentUser.artisan_profile) {
      const updatedProfile = {
        ...currentUser.artisan_profile,
        skill_test_status: newStatus,
      };
      const idx = localStore.users.findIndex(u => u.id === currentUser.id);
      if (idx >= 0) localStore.users[idx].artisan_profile = updatedProfile;

      if (isFirestoreAvailable()) {
        try {
          await ensureFirebaseAuthSession(currentUser);
          const db = getFirebaseDb();
          await updateDoc(doc(db, COLLECTIONS.USERS, String(currentUser.id)), {
            artisan_profile: updatedProfile,
          });
        } catch {
          markFirestoreUnavailable();
        }
      }
    }

    await logAuditAction(
      currentUser.id,
      'SKILL_QUIZ_COMPLETED',
      `Artisan took ${skill.name} quiz. Score: ${scorePct.toFixed(1)}% (${correctCount}/${totalQuestions}). Passed: ${passed}`
    );

    return {
      total_questions: totalQuestions,
      correct_count: correctCount,
      score_percentage: Math.round(scorePct * 10) / 10,
      passed,
      skill_test_status: newStatus,
    };
  },

  // KYC
  submitKYC: async (payload: { id_type: string; id_token: string }, token: string) => {
    const currentUser = await requireUser(token);
    if (!currentUser.artisan_profile) {
      throw new Error('Artisan profile not found.');
    }
    if (!payload.id_token || payload.id_token.trim().length < 5) {
      throw new Error('Invalid NIN or BVN verification token string.');
    }

    const kycId = await getNextSequenceId('kyc_verifications', COLLECTIONS.KYC);
    const kycEntry: SeedKYC = {
      id: kycId,
      artisan_id: currentUser.artisan_profile.id,
      user_id: currentUser.id,
      id_type: payload.id_type.toUpperCase(),
      id_token: payload.id_token.trim(),
      status: 'pending',
      notes: null,
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
    };

    const updatedProfile = {
      ...currentUser.artisan_profile,
      kyc_status: 'pending' as const,
      nin_bvn_token: payload.id_token.trim(),
    };

    localStore.kyc.push(kycEntry);
    const idx = localStore.users.findIndex(u => u.id === currentUser.id);
    if (idx >= 0) localStore.users[idx].artisan_profile = updatedProfile;

    if (isFirestoreAvailable()) {
      try {
        const db = getFirebaseDb();
        await Promise.all([
          setDoc(doc(db, COLLECTIONS.KYC, String(kycId)), kycEntry),
          updateDoc(doc(db, COLLECTIONS.USERS, String(currentUser.id)), {
            artisan_profile: updatedProfile,
          }),
        ]);
      } catch {
        markFirestoreUnavailable();
      }
    }

    await logAuditAction(
      currentUser.id,
      'KYC_TOKEN_SUBMITTED',
      `Artisan submitted ${payload.id_type} token: ${payload.id_token}`
    );

    return kycEntry;
  },

  getKYCStatus: async (token: string) => {
    const currentUser = await requireUser(token);
    if (!currentUser.artisan_profile) return [];

    const allKyc = await fetchAllFromCollection<SeedKYC>(COLLECTIONS.KYC);

    return allKyc.filter(
      k => k.user_id === currentUser.id || k.artisan_id === currentUser.artisan_profile?.id
    );
  },

  // Bookings & Bids
  getBookings: async (params?: { status?: string; my_jobs?: boolean }, token?: string) => {
    await ensureDatabaseSeeded();
    const currentUser = token ? await resolveUserByToken(token) : null;

    const allBookings = await fetchAllFromCollection<SeedBooking>(COLLECTIONS.BOOKINGS);
    const hydrated = await hydrateBookings(allBookings);

    let filtered = hydrated;
    if (params?.my_jobs && currentUser) {
      if (currentUser.role === 'customer') {
        filtered = filtered.filter(b => b.customer_id === currentUser.id);
      } else if (currentUser.role === 'artisan') {
        filtered = filtered.filter(b =>
          (b.bids || []).some((bid: any) => bid.artisan_id === currentUser.id)
        );
      }
    }

    if (params?.status) {
      filtered = filtered.filter(b => b.status === params.status);
    }

    return filtered;
  },

  createBooking: async (payload: any, token: string) => {
    const currentUser = await requireUser(token);
    const skills = await api.getSkills();
    const skill = skills.find(s => s.id === Number(payload.skill_id));
    if (!skill) {
      throw new Error('Skill category not found.');
    }

    const bookingId = await getNextSequenceId('bookings', COLLECTIONS.BOOKINGS);
    const now = new Date().toISOString();
    const newBooking: SeedBooking = {
      id: bookingId,
      customer_id: currentUser.id,
      skill_id: skill.id,
      title: payload.title,
      description: payload.description,
      address: payload.address,
      latitude: payload.latitude ?? currentUser.latitude ?? 8.8471,
      longitude: payload.longitude ?? currentUser.longitude ?? 7.8732,
      emergency_level: payload.emergency_level || 'medium',
      budget: Number(payload.budget) || 5000.0,
      agreed_price: null,
      status: 'requested',
      created_at: now,
      updated_at: now,
    };

    localStore.bookings.push(newBooking);
    if (isFirestoreAvailable()) {
      try {
        const db = getFirebaseDb();
        await setDoc(doc(db, COLLECTIONS.BOOKINGS, String(bookingId)), newBooking);
      } catch {
        markFirestoreUnavailable();
      }
    }

    await logAuditAction(
      currentUser.id,
      'BOOKING_CREATED',
      `Customer ${currentUser.name} created booking '${newBooking.title}' (ID #${newBooking.id})`
    );

    const [hydrated] = await hydrateBookings([newBooking]);
    return hydrated;
  },

  submitBid: async (
    bookingId: number,
    payload: { proposed_price: number; estimated_hours: number; notes: string },
    token: string
  ) => {
    const currentUser = await requireUser(token);
    if (!currentUser.artisan_profile) {
      throw new Error('Artisan profile missing.');
    }

    const allBookings = await fetchAllFromCollection<SeedBooking>(COLLECTIONS.BOOKINGS);
    const booking = allBookings.find(b => b.id === Number(bookingId));
    if (!booking) {
      throw new Error('Booking request not found.');
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      throw new Error('Cannot place bid on closed/completed job.');
    }

    const allBids = await fetchAllFromCollection<SeedBid>(COLLECTIONS.BIDS);
    const existingBid = allBids.find(
      b => b.booking_id === Number(bookingId) && b.artisan_id === currentUser.id
    );

    if (existingBid) {
      const updatedBid: SeedBid = {
        ...existingBid,
        proposed_price: Number(payload.proposed_price),
        estimated_hours: Number(payload.estimated_hours) || 2,
        notes: payload.notes,
      };
      const idx = localStore.bids.findIndex(b => b.id === existingBid.id);
      if (idx >= 0) localStore.bids[idx] = updatedBid;

      if (isFirestoreAvailable()) {
        try {
          const db = getFirebaseDb();
          await setDoc(doc(db, COLLECTIONS.BIDS, String(existingBid.id)), updatedBid);
        } catch {
          markFirestoreUnavailable();
        }
      }

      await logAuditAction(
        currentUser.id,
        'BID_UPDATED',
        `Artisan updated bid to ₦${payload.proposed_price} on booking #${bookingId}`
      );
      return updatedBid;
    }

    const bidId = await getNextSequenceId('bids', COLLECTIONS.BIDS);
    const newBid: SeedBid = {
      id: bidId,
      booking_id: Number(bookingId),
      artisan_id: currentUser.id,
      proposed_price: Number(payload.proposed_price),
      estimated_hours: Number(payload.estimated_hours) || 2,
      notes: payload.notes,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const nextStatus = booking.status === 'requested' ? 'bidding_open' : booking.status;

    localStore.bids.push(newBid);
    const bIdx = localStore.bookings.findIndex(b => b.id === booking.id);
    if (bIdx >= 0) {
      localStore.bookings[bIdx].status = nextStatus;
      localStore.bookings[bIdx].updated_at = new Date().toISOString();
    }

    if (isFirestoreAvailable()) {
      try {
        const db = getFirebaseDb();
        await Promise.all([
          setDoc(doc(db, COLLECTIONS.BIDS, String(bidId)), newBid),
          booking.status === 'requested'
            ? updateDoc(doc(db, COLLECTIONS.BOOKINGS, String(booking.id)), {
                status: 'bidding_open',
                updated_at: new Date().toISOString(),
              })
            : Promise.resolve(),
        ]);
      } catch {
        markFirestoreUnavailable();
      }
    }

    await logAuditAction(
      currentUser.id,
      'BID_SUBMITTED',
      `Artisan ${currentUser.name} placed ₦${payload.proposed_price} bid on booking #${bookingId}`
    );

    return newBid;
  },

  acceptBid: async (bookingId: number, bidId: number, token: string) => {
    const currentUser = await requireUser(token);
    const allBookings = await fetchAllFromCollection<SeedBooking>(COLLECTIONS.BOOKINGS);
    const booking = allBookings.find(
      b => b.id === Number(bookingId) && b.customer_id === currentUser.id
    );
    if (!booking) {
      throw new Error('Booking not found or not owned by current customer.');
    }

    const allBids = await fetchAllFromCollection<SeedBid>(COLLECTIONS.BIDS);
    const bookingBids = allBids.filter(b => b.booking_id === Number(bookingId));
    const chosenBid = bookingBids.find(b => b.id === Number(bidId));
    if (!chosenBid) {
      throw new Error('Bid not found for this booking.');
    }

    const now = new Date().toISOString();
    const updatedBooking: SeedBooking = {
      ...booking,
      agreed_price: chosenBid.proposed_price,
      status: 'accepted',
      updated_at: now,
    };

    for (const b of localStore.bids) {
      if (b.booking_id === Number(bookingId)) {
        b.status = b.id === chosenBid.id ? 'accepted' : 'rejected';
      }
    }
    const bIdx = localStore.bookings.findIndex(b => b.id === booking.id);
    if (bIdx >= 0) localStore.bookings[bIdx] = updatedBooking;

    if (isFirestoreAvailable()) {
      try {
        const db = getFirebaseDb();
        await Promise.all([
          ...bookingBids.map(b =>
            updateDoc(doc(db, COLLECTIONS.BIDS, String(b.id)), {
              status: b.id === chosenBid.id ? 'accepted' : 'rejected',
            })
          ),
          setDoc(doc(db, COLLECTIONS.BOOKINGS, String(booking.id)), updatedBooking),
        ]);
      } catch {
        markFirestoreUnavailable();
      }
    }

    await logAuditAction(
      currentUser.id,
      'BID_ACCEPTED',
      `Customer accepted bid #${chosenBid.id} (₦${chosenBid.proposed_price}) for booking #${bookingId}`
    );

    const [hydrated] = await hydrateBookings([updatedBooking]);
    return hydrated;
  },

  updateBookingStatus: async (bookingId: number, status: string, token: string) => {
    const currentUser = await requireUser(token);
    const allBookings = await fetchAllFromCollection<SeedBooking>(COLLECTIONS.BOOKINGS);
    const booking = allBookings.find(b => b.id === Number(bookingId));
    if (!booking) {
      throw new Error('Booking not found.');
    }

    const updatedBooking: SeedBooking = {
      ...booking,
      status: status as SeedBooking['status'],
      updated_at: new Date().toISOString(),
    };

    const idx = localStore.bookings.findIndex(b => b.id === booking.id);
    if (idx >= 0) localStore.bookings[idx] = updatedBooking;

    if (isFirestoreAvailable()) {
      try {
        const db = getFirebaseDb();
        await setDoc(doc(db, COLLECTIONS.BOOKINGS, String(booking.id)), updatedBooking);
      } catch {
        markFirestoreUnavailable();
      }
    }

    await logAuditAction(
      currentUser.id,
      'BOOKING_STATUS_CHANGED',
      `Booking #${bookingId} status updated to '${status}' by ${currentUser.name}`
    );

    const [hydrated] = await hydrateBookings([updatedBooking]);
    return hydrated;
  },

  // Reviews
  submitReview: async (
    payload: { booking_id: number; rating: number; comment?: string },
    token: string
  ) => {
    const currentUser = await requireUser(token);
    const allBookings = await fetchAllFromCollection<SeedBooking>(COLLECTIONS.BOOKINGS);
    const booking = allBookings.find(
      b => b.id === Number(payload.booking_id) && b.customer_id === currentUser.id
    );
    if (!booking) {
      throw new Error('Booking not found or not owned by current customer.');
    }
    if (booking.status !== 'completed') {
      throw new Error('Can only review completed bookings.');
    }

    const allReviews = await fetchAllFromCollection<SeedReview>(COLLECTIONS.REVIEWS);
    if (allReviews.some(r => r.booking_id === booking.id)) {
      throw new Error('A review has already been submitted for this booking.');
    }

    const allBids = await fetchAllFromCollection<SeedBid>(COLLECTIONS.BIDS);
    const acceptedBid =
      allBids.find(b => b.booking_id === booking.id && b.status === 'accepted') ||
      allBids.find(b => b.booking_id === booking.id);
    if (!acceptedBid) {
      throw new Error('No accepted artisan found for this booking.');
    }

    const artisanUserId = acceptedBid.artisan_id;
    const reviewId = await getNextSequenceId('reviews', COLLECTIONS.REVIEWS);
    const newReview: SeedReview = {
      id: reviewId,
      booking_id: booking.id,
      customer_id: currentUser.id,
      artisan_id: artisanUserId,
      rating: Number(payload.rating),
      comment: payload.comment || '',
      created_at: new Date().toISOString(),
    };

    const artisanReviews = [...allReviews.filter(r => r.artisan_id === artisanUserId), newReview];
    const ratingCount = artisanReviews.length;
    const ratingAvg =
      Math.round(
        (artisanReviews.reduce((sum, r) => sum + Number(r.rating), 0) / ratingCount) * 10
      ) / 10;

    localStore.reviews.push(newReview);
    const uIdx = localStore.users.findIndex(u => u.id === artisanUserId);
    if (uIdx >= 0 && localStore.users[uIdx].artisan_profile) {
      localStore.users[uIdx].artisan_profile = {
        ...localStore.users[uIdx].artisan_profile!,
        rating_avg: ratingAvg,
        rating_count: ratingCount,
      };
    }

    if (isFirestoreAvailable()) {
      try {
        const db = getFirebaseDb();
        await setDoc(doc(db, COLLECTIONS.REVIEWS, String(reviewId)), newReview);
        const artisanSnap = await getDoc(doc(db, COLLECTIONS.USERS, String(artisanUserId)));
        if (artisanSnap.exists()) {
          const artisanData = artisanSnap.data() as SeedUser;
          if (artisanData.artisan_profile) {
            await updateDoc(doc(db, COLLECTIONS.USERS, String(artisanUserId)), {
              artisan_profile: {
                ...artisanData.artisan_profile,
                rating_avg: ratingAvg,
                rating_count: ratingCount,
              },
            });
          }
        }
      } catch {
        markFirestoreUnavailable();
      }
    }

    await logAuditAction(
      currentUser.id,
      'REVIEW_SUBMITTED',
      `Customer rated Artisan #${artisanUserId} ${payload.rating}/5 stars for booking #${booking.id}`
    );

    return newReview;
  },

  getArtisanReviews: async (artisanId: number) => {
    await ensureDatabaseSeeded();
    const allReviews = await fetchAllFromCollection<SeedReview>(COLLECTIONS.REVIEWS);

    return allReviews
      .filter(r => r.artisan_id === Number(artisanId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // Admin Module
  getAdminStats: async (_token?: string) => {
    await ensureDatabaseSeeded();
    const [allUsers, allKyc, allBookings] = await Promise.all([
      fetchAllFromCollection<SeedUser>(COLLECTIONS.USERS),
      fetchAllFromCollection<SeedKYC>(COLLECTIONS.KYC),
      fetchAllFromCollection<SeedBooking>(COLLECTIONS.BOOKINGS),
    ]);

    const totalUsers = allUsers.length;
    const totalCustomers = allUsers.filter(u => u.role === 'customer').length;
    const totalArtisans = allUsers.filter(u => u.role === 'artisan').length;
    const verifiedArtisans = allUsers.filter(
      u => u.role === 'artisan' && u.artisan_profile?.kyc_status === 'approved'
    ).length;
    const pendingKycCount = allKyc.filter(k => k.status === 'pending').length;
    const totalBookings = allBookings.length;
    const activeStatuses = new Set(['requested', 'bidding_open', 'accepted', 'in_progress']);
    const activeBookings = allBookings.filter(b => activeStatuses.has(b.status)).length;
    const completedBookings = allBookings.filter(b => b.status === 'completed').length;

    return {
      total_users: totalUsers,
      total_customers: totalCustomers,
      total_artisans: totalArtisans,
      verified_artisans: verifiedArtisans,
      pending_kyc_count: pendingKycCount,
      total_bookings: totalBookings,
      active_bookings: activeBookings,
      completed_bookings: completedBookings,
    };
  },

  getAuditLogs: async (_token?: string) => {
    await ensureDatabaseSeeded();
    const logs = await fetchAllFromCollection<SeedAuditLog>(COLLECTIONS.AUDIT_LOGS);

    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);
  },

  getPendingKYC: async (_token?: string) => {
    await ensureDatabaseSeeded();
    const allKyc = await fetchAllFromCollection<SeedKYC>(COLLECTIONS.KYC);

    return allKyc
      .filter(k => k.status === 'pending')
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  },

  approveKYC: async (kycId: number, approved: boolean, notes: string, token?: string) => {
    await ensureDatabaseSeeded();
    const currentUser = token ? await resolveUserByToken(token) : null;
    const allKyc = await fetchAllFromCollection<SeedKYC>(COLLECTIONS.KYC);

    const kycEntry = allKyc.find(k => k.id === Number(kycId));
    if (!kycEntry) {
      throw new Error('KYC submission record not found.');
    }

    const newStatus: 'approved' | 'rejected' = approved ? 'approved' : 'rejected';
    const updatedKyc: SeedKYC = {
      ...kycEntry,
      status: newStatus,
      notes,
      reviewed_at: new Date().toISOString(),
    };

    const allUsers = await fetchAllFromCollection<SeedUser>(COLLECTIONS.USERS);
    const artisanUser = allUsers.find(
      u => u.id === kycEntry.user_id || u.artisan_profile?.id === kycEntry.artisan_id
    );

    const kIdx = localStore.kyc.findIndex(k => k.id === kycEntry.id);
    if (kIdx >= 0) localStore.kyc[kIdx] = updatedKyc;
    if (artisanUser?.artisan_profile) {
      artisanUser.artisan_profile.kyc_status = newStatus;
    }

    if (isFirestoreAvailable()) {
      try {
        await ensureFirebaseAuthSession(currentUser);
        const db = getFirebaseDb();
        await setDoc(doc(db, COLLECTIONS.KYC, String(kycEntry.id)), updatedKyc);
        if (artisanUser?.artisan_profile) {
          await updateDoc(doc(db, COLLECTIONS.USERS, String(artisanUser.id)), {
            artisan_profile: {
              ...artisanUser.artisan_profile,
              kyc_status: newStatus,
            },
          });
        }
      } catch {
        markFirestoreUnavailable();
      }
    }

    await logAuditAction(
      currentUser?.id ?? 1,
      'KYC_REVIEWED',
      `Admin reviewed KYC #${kycId} for Artisan #${artisanUser?.id ?? 'N/A'}. Result: ${newStatus}`
    );

    return updatedKyc;
  },
};
