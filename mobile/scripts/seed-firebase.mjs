import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, writeBatch, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mobileRoot = path.resolve(__dirname, '..');

// Load .env from mobile/ or repo root if present
for (const envPath of [path.join(mobileRoot, '.env'), path.resolve(mobileRoot, '..', '.env')]) {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

let appJsonFirebase = {};
try {
  const appJson = JSON.parse(fs.readFileSync(path.join(mobileRoot, 'app.json'), 'utf8'));
  appJsonFirebase = appJson?.expo?.extra?.firebase || {};
} catch {
  // Ignore
}

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyC72BfxKvn_iy-3h8L_jQ4-9Gz9uLUg01M',
  authDomain: 'artisan-students-project.firebaseapp.com',
  projectId: 'artisan-students-project',
  storageBucket: 'artisan-students-project.firebasestorage.app',
  messagingSenderId: '107534628213',
  appId: '1:107534628213:web:98a97086b27cfb8e444f3c',
  measurementId: 'G-C1ZVDEJQ88',
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || appJsonFirebase.apiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || appJsonFirebase.authDomain || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || appJsonFirebase.projectId || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || appJsonFirebase.storageBucket || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || appJsonFirebase.messagingSenderId || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || appJsonFirebase.appId || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || appJsonFirebase.measurementId || DEFAULT_FIREBASE_CONFIG.measurementId,
};

const placeholders = new Set(['', 'your-api-key', 'your-project-id', 'YOUR_API_KEY', 'YOUR_PROJECT_ID']);
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || placeholders.has(firebaseConfig.apiKey) || placeholders.has(firebaseConfig.projectId)) {
  console.error(
    '⚠️  Firebase credentials are not configured yet.\n' +
    'Please set EXPO_PUBLIC_FIREBASE_API_KEY and EXPO_PUBLIC_FIREBASE_PROJECT_ID in mobile/.env (see mobile/.env.example),\n' +
    'then run `npm run seed` again. Note: the mobile app will also auto-seed on launch once credentials are provided.'
  );
  process.exit(1);
}

const BASE_TIMESTAMP = '2026-09-20T10:00:00.000Z';

const SEED_SKILLS = [
  {
    id: 1,
    name: 'Plumbing & Pipefitting',
    category: 'Mechanical Services',
    description: 'Pipe repairs, water tank installations, drainage cleaning, and emergency leak fixes.',
    questions: [
      {
        id: 1,
        skill_id: 1,
        question_text: 'What is the recommended tool to tighten a loose P-trap under a sink without damaging plastic threads?',
        option_a: 'Sledgehammer',
        option_b: 'Adjustable Strap Wrench / Hand tightening',
        option_c: 'Blowtorch',
        option_d: 'Chisel',
        correct_option: 'B',
      },
      {
        id: 2,
        skill_id: 1,
        question_text: 'Which material is standard for modern domestic hot water supply lines in Nigeria?',
        option_a: 'Lead piping',
        option_b: 'PPR (Polypropylene Random) or CPVC pipes',
        option_c: 'Cardboard tubing',
        option_d: 'Bamboo',
        correct_option: 'B',
      },
      {
        id: 3,
        skill_id: 1,
        question_text: 'What is the primary function of a non-return check valve in a plumbing system?',
        option_a: 'To increase water temperature',
        option_b: 'To prevent backflow of water into clean supply',
        option_c: 'To filter sand',
        option_d: 'To release excess air',
        correct_option: 'B',
      },
    ],
  },
  {
    id: 2,
    name: 'Electrical & Wiring Repairs',
    category: 'Electrical Engineering',
    description: 'Circuit troubleshooting, distribution box setup, inverter wiring, and light fitting.',
    questions: [
      {
        id: 4,
        skill_id: 2,
        question_text: 'Before troubleshooting a shorted domestic circuit breaker, what safety action must be performed first?',
        option_a: 'Pour water on the panel',
        option_b: 'Isolate the main power switch / turn off mains supply',
        option_c: 'Touch bare wires with bare hands',
        option_d: 'Increase voltage rating',
        correct_option: 'B',
      },
      {
        id: 5,
        skill_id: 2,
        question_text: 'In standard single-phase wiring (UK/Nigerian code), what color corresponds to Live line?',
        option_a: 'Green/Yellow',
        option_b: 'Brown or Red',
        option_c: 'Blue or Black',
        option_d: 'White',
        correct_option: 'B',
      },
      {
        id: 6,
        skill_id: 2,
        question_text: 'What instrument is used to measure electrical insulation resistance?',
        option_a: 'Thermometer',
        option_b: 'Megohmmeter (Megger)',
        option_c: 'Barometer',
        option_d: 'Micrometer',
        correct_option: 'B',
      },
    ],
  },
  {
    id: 3,
    name: 'Carpentry & Furniture Fabrication',
    category: 'Woodworking',
    description: 'Door framing, roofing truss repair, custom furniture, and cabinet installation.',
    questions: [
      {
        id: 7,
        skill_id: 3,
        question_text: 'Which joint type provides superior resistance to pulling apart in drawer construction?',
        option_a: 'Butt joint',
        option_b: 'Dovetail joint',
        option_c: 'Tape joint',
        option_d: 'Glue spot',
        correct_option: 'B',
      },
      {
        id: 8,
        skill_id: 3,
        question_text: 'What wood treatment is commonly applied in tropical environments to prevent termite infestation?',
        option_a: 'Sugar water',
        option_b: 'Anti-termite chemical / Creosote treatment',
        option_c: 'Palm oil coating',
        option_d: 'Fresh water soaking',
        correct_option: 'B',
      },
    ],
  },
  {
    id: 4,
    name: 'HVAC & Refrigeration Mechanics',
    category: 'Cooling Systems',
    description: 'Split AC installation, refrigerant gas refilling, compressor repair, and maintenance.',
    questions: [
      {
        id: 9,
        skill_id: 4,
        question_text: 'What refrigerant gas is commonly used in modern eco-friendly residential air conditioners?',
        option_a: 'R-410A / R-32',
        option_b: 'Pure Propane',
        option_c: 'Carbon Monoxide',
        option_d: 'Sulfuric Gas',
        correct_option: 'A',
      },
      {
        id: 10,
        skill_id: 4,
        question_text: 'If an air conditioner evaporator coil freezes into ice, what is a likely cause?',
        option_a: 'High ambient light',
        option_b: 'Low refrigerant gas leak or restricted airflow (clogged filter)',
        option_c: 'Overfilled oil',
        option_d: 'Clean fan blades',
        correct_option: 'B',
      },
    ],
  },
  {
    id: 5,
    name: 'Masonry & Building Maintenance',
    category: 'Civil Construction',
    description: 'Blockwork, wall plastering, tiling, foundation repair, and concrete casting.',
    questions: [
      {
        id: 11,
        skill_id: 5,
        question_text: 'What standard mix ratio of Cement to Sand is typically used for interior wall plastering (rendering)?',
        option_a: '1:1',
        option_b: '1:4 or 1:6',
        option_c: '1:20',
        option_d: '10:1',
        correct_option: 'B',
      },
    ],
  },
];

const SEED_USERS = [
  {
    id: 1,
    name: 'System Administrator',
    email: 'admin@artisanhub.ng',
    phone: '+2348000000000',
    password: 'password123',
    role: 'admin',
    location_name: 'Nasarawa State University, Keffi',
    latitude: 8.8471,
    longitude: 7.8732,
    created_at: BASE_TIMESTAMP,
    artisan_profile: null,
  },
  {
    id: 2,
    name: 'Amina Lawal',
    email: 'amina@gmail.com',
    phone: '+2348011112222',
    password: 'password123',
    role: 'customer',
    location_name: 'Highland Quarters, Keffi',
    latitude: 8.848,
    longitude: 7.874,
    created_at: BASE_TIMESTAMP,
    artisan_profile: null,
  },
  {
    id: 3,
    name: 'Emeka Okafor',
    email: 'emeka@gmail.com',
    phone: '+2348033334444',
    password: 'password123',
    role: 'customer',
    location_name: 'GRA Road, Keffi',
    latitude: 8.845,
    longitude: 7.871,
    created_at: BASE_TIMESTAMP,
    artisan_profile: null,
  },
  {
    id: 4,
    name: 'Tunde Bakare',
    email: 'tunde@plumbing.ng',
    phone: '+2348055556666',
    password: 'password123',
    role: 'artisan',
    location_name: 'Market Street, Keffi',
    latitude: 8.8465,
    longitude: 7.8725,
    created_at: BASE_TIMESTAMP,
    artisan_profile: {
      id: 1,
      user_id: 4,
      bio: 'Master plumber with over 8 years experience servicing residential and commercial buildings across Nasarawa.',
      trade_category: 'Plumbing & Pipefitting',
      hourly_rate: 3000.0,
      years_experience: 8,
      is_available: true,
      kyc_status: 'approved',
      skill_test_status: 'passed',
      nin_bvn_token: 'NIN-22948194019',
      rating_avg: 4.8,
      rating_count: 12,
    },
  },
  {
    id: 5,
    name: 'Ibrahim Musa',
    email: 'ibrahim@sparks.ng',
    phone: '+2348077778888',
    password: 'password123',
    role: 'artisan',
    location_name: 'Station Road, Keffi',
    latitude: 8.849,
    longitude: 7.875,
    created_at: BASE_TIMESTAMP,
    artisan_profile: {
      id: 2,
      user_id: 5,
      bio: 'Certified electrician specializing in rapid fault detection, solar inverter setup, and DB panel repairs.',
      trade_category: 'Electrical & Wiring Repairs',
      hourly_rate: 3500.0,
      years_experience: 6,
      is_available: true,
      kyc_status: 'approved',
      skill_test_status: 'passed',
      nin_bvn_token: 'BVN-22104928104',
      rating_avg: 5.0,
      rating_count: 7,
    },
  },
  {
    id: 6,
    name: 'Chidi Nnamdi',
    email: 'chidi@woodcraft.ng',
    phone: '+2348099990000',
    password: 'password123',
    role: 'artisan',
    location_name: 'Angwan Lambu, Keffi',
    latitude: 8.844,
    longitude: 7.876,
    created_at: BASE_TIMESTAMP,
    artisan_profile: {
      id: 3,
      user_id: 6,
      bio: 'Expert wood craftsman for custom roofing frames, solid wood doors, and modern kitchen cabinets.',
      trade_category: 'Carpentry & Furniture Fabrication',
      hourly_rate: 2800.0,
      years_experience: 4,
      is_available: true,
      kyc_status: 'pending',
      skill_test_status: 'pending',
      nin_bvn_token: 'NIN-88491028471',
      rating_avg: 0.0,
      rating_count: 0,
    },
  },
];

const SEED_KYC_VERIFICATIONS = [
  {
    id: 1,
    artisan_id: 1,
    user_id: 4,
    id_type: 'NIN',
    id_token: 'NIN-22948194019',
    status: 'approved',
    notes: 'Identity verified via National Identity Management System query.',
    submitted_at: BASE_TIMESTAMP,
    reviewed_at: BASE_TIMESTAMP,
  },
  {
    id: 2,
    artisan_id: 2,
    user_id: 5,
    id_type: 'BVN',
    id_token: 'BVN-22104928104',
    status: 'approved',
    notes: 'Bank verification token checked.',
    submitted_at: BASE_TIMESTAMP,
    reviewed_at: BASE_TIMESTAMP,
  },
  {
    id: 3,
    artisan_id: 3,
    user_id: 6,
    id_type: 'NIN',
    id_token: 'NIN-88491028471',
    status: 'pending',
    notes: 'Awaiting admin approval.',
    submitted_at: BASE_TIMESTAMP,
    reviewed_at: null,
  },
];

const SEED_BOOKINGS = [
  {
    id: 1,
    customer_id: 2,
    skill_id: 1,
    title: 'Burst Water Pipe under Kitchen Sink',
    description: 'High pressure water line split under kitchen sink flooding cabinet. Needs urgent repair within 2 hours.',
    address: 'Block B4, Highland Quarters, Keffi',
    latitude: 8.848,
    longitude: 7.874,
    emergency_level: 'emergency',
    budget: 6000.0,
    agreed_price: 5500.0,
    status: 'completed',
    created_at: BASE_TIMESTAMP,
    updated_at: BASE_TIMESTAMP,
  },
  {
    id: 2,
    customer_id: 3,
    skill_id: 2,
    title: 'Short Circuit in Main Distribution Box',
    description: 'Tripping main breaker whenever AC is switched on. Needs diagnostic fault trace.',
    address: 'Plot 12, GRA Road, Keffi',
    latitude: 8.845,
    longitude: 7.871,
    emergency_level: 'medium',
    budget: 7000.0,
    agreed_price: null,
    status: 'bidding_open',
    created_at: '2026-09-20T11:00:00.000Z',
    updated_at: '2026-09-20T11:00:00.000Z',
  },
];

const SEED_BIDS = [
  {
    id: 1,
    booking_id: 1,
    artisan_id: 4,
    proposed_price: 5500.0,
    estimated_hours: 1,
    notes: 'I am located 5 mins away at Market Street. Can arrive with replacement PPR pipe immediately.',
    status: 'accepted',
    created_at: BASE_TIMESTAMP,
  },
  {
    id: 2,
    booking_id: 2,
    artisan_id: 5,
    proposed_price: 6500.0,
    estimated_hours: 2,
    notes: 'I have insulation resistance testing equipment to pinpoint short circuits quickly.',
    status: 'pending',
    created_at: '2026-09-20T11:30:00.000Z',
  },
];

const SEED_REVIEWS = [
  {
    id: 1,
    booking_id: 1,
    customer_id: 2,
    artisan_id: 4,
    rating: 5,
    comment: 'Tunde arrived in 10 minutes and completely fixed the burst pipe! Very professional and clean work.',
    created_at: BASE_TIMESTAMP,
  },
];

const SEED_AUDIT_LOGS = [
  {
    id: 1,
    user_id: 1,
    action: 'SYSTEM_INIT',
    details: 'Firebase Firestore database initialized and seeded with baseline skills, accounts, and test jobs.',
    timestamp: BASE_TIMESTAMP,
  },
];

async function runSeed() {
  const force = process.argv.includes('--force');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  if (!force) {
    try {
      const [adminSnap, skillSnap] = await Promise.all([
        getDoc(doc(db, 'users', '1')),
        getDoc(doc(db, 'skills', '1')),
      ]);
      if (adminSnap.exists() && skillSnap.exists()) {
        console.log('✅ Firebase Firestore already contains seed data. (Use --force to overwrite)');
        process.exit(0);
      }
    } catch {
      // If rules require auth before reading, proceed to auth step first
    }
  }

  console.log(`🔐 Provisioning & authenticating Firebase Auth accounts on "${firebaseConfig.projectId}"...`);
  const uidMap = new Map();

  for (const seedUser of SEED_USERS) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, seedUser.email, seedUser.password);
      uidMap.set(seedUser.id, cred.user.uid);
      console.log(`   • Created Firebase Auth user: ${seedUser.email}`);
    } catch (err) {
      if (err?.code === 'auth/email-already-in-use') {
        try {
          const cred = await signInWithEmailAndPassword(auth, seedUser.email, seedUser.password);
          uidMap.set(seedUser.id, cred.user.uid);
          console.log(`   • Authenticated existing Firebase Auth user: ${seedUser.email}`);
        } catch {
          console.log(`   • Firebase Auth user already exists: ${seedUser.email}`);
        }
      } else {
        console.warn(`   ⚠️ Skipped Firebase Auth creation for ${seedUser.email} (${err?.code || err?.message})`);
      }
    }
  }

  // Ensure we are signed in as admin before writing to Firestore (satisfies `request.auth != null` rules)
  try {
    await signInWithEmailAndPassword(auth, SEED_USERS[0].email, SEED_USERS[0].password);
  } catch {
    // Ignore if Auth provider is disabled
  }

  if (!force) {
    const [adminSnap, skillSnap] = await Promise.all([
      getDoc(doc(db, 'users', '1')),
      getDoc(doc(db, 'skills', '1')),
    ]);
    if (adminSnap.exists() && skillSnap.exists()) {
      console.log('✅ Firebase Firestore already contains seed data. (Use --force to overwrite)');
      process.exit(0);
    }
  }

  console.log(`🚀 Seeding Cloud Firestore on "${firebaseConfig.projectId}"...`);
  const batch = writeBatch(db);

  for (const skill of SEED_SKILLS) batch.set(doc(db, 'skills', String(skill.id)), skill);
  for (const user of SEED_USERS) {
    const uid = uidMap.get(user.id);
    batch.set(doc(db, 'users', String(user.id)), uid ? { ...user, uid } : user);
  }
  for (const kyc of SEED_KYC_VERIFICATIONS) batch.set(doc(db, 'kyc_verifications', String(kyc.id)), kyc);
  for (const booking of SEED_BOOKINGS) batch.set(doc(db, 'bookings', String(booking.id)), booking);
  for (const bid of SEED_BIDS) batch.set(doc(db, 'bids', String(bid.id)), bid);
  for (const review of SEED_REVIEWS) batch.set(doc(db, 'reviews', String(review.id)), review);
  for (const log of SEED_AUDIT_LOGS) batch.set(doc(db, 'audit_logs', String(log.id)), log);

  batch.set(doc(db, 'counters', 'sequences'), {
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
  console.log('✅ Firestore collections seeded (skills, users, kyc_verifications, bookings, bids, reviews, audit_logs).');

  try {
    await signOut(auth);
  } catch {
    // Ignore
  }

  console.log('🎉 ArtisanHub Firebase seeding completed!');
  process.exit(0);
}

runSeed().catch(err => {
  if (err?.code === 'permission-denied') {
    console.log('\n⚠️  Firebase Authentication accounts are ready, but Cloud Firestore returned `permission-denied`.');
    console.log('   To enable live Cloud Firestore writes on "artisan-students-project":');
    console.log('   1. Open https://console.firebase.google.com/project/artisan-students-project/firestore/rules');
    console.log('   2. Paste the rules from `firestore.rules` (or set `allow read, write: if request.auth != null;` / `if true;`) and click Publish.');
    console.log('   3. Re-run `npm run seed` (or simply open the mobile app, which auto-seeds Firestore on launch).\n');
    process.exit(0);
  }
  console.error('❌ Failed to seed Firebase database:', err);
  process.exit(1);
});
