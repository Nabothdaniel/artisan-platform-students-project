# ArtisanHub (Firebase Edition)

ArtisanHub is a service marketplace for connecting customers with verified local artisans. Customers can post jobs, receive negotiable bids, accept an artisan, track job status, and submit reviews. Artisans can manage their profiles, complete skill assessments, submit KYC information, and bid on available jobs. Administrators can review KYC submissions and inspect platform activity.

This branch (`firebase`) uses a serverless architecture powered by **React Native (Expo)**, **Firebase Authentication**, and **Cloud Firestore**, with automatic database seeding.

## Repository Structure

- `mobile/`: Expo and React Native client for Android, iOS, and web, integrated directly with Firebase Auth & Cloud Firestore.
- `mobile/src/services/firebase.ts`: Firebase SDK initialization and configuration loader.
- `mobile/src/services/seed.ts` & `mobile/src/services/seedData.ts`: Automatic idempotent Firestore + Firebase Auth seeder on app launch.
- `mobile/scripts/seed-firebase.mjs`: Standalone CLI script (`npm run seed`) to seed the Firebase database from the terminal.
- `firestore.rules` & `firestore.indexes.json`: Cloud Firestore security rules and index configuration.

## Requirements

- Node.js 18+ and npm
- A Firebase project with **Cloud Firestore** and **Authentication (Email/Password)** enabled
- Expo CLI through the local mobile dependencies

## One-Command Setup (Windows Git Bash / macOS / Linux)

After cloning, run this from the repo root. On Windows use **Git Bash** (installed with [Git for Windows](https://git-scm.com/download/win)):

```bash
git clone <repo-url>
cd artisan-platform-students-project
bash scripts/setup.sh
```

The script checks Node 18+, creates `mobile/.env` from `.env.example` (pre-filled with the shared Firebase project), installs dependencies, typechecks, and seeds Firebase. Use `bash scripts/setup.sh --no-seed` to skip seeding. Then start the app with `npm start`.

Not using Git Bash? From cmd or PowerShell run `scripts\setup.bat` instead.

The seed script already prefers IPv4, which avoids `auth/network-request-failed` / "client is offline" timeouts on some networks.

## Quick Start (manual)

1. Configure your Firebase project credentials in `mobile/.env` (copy from `mobile/.env.example`):

**macOS / Linux / Git Bash:**
```bash
cp mobile/.env.example mobile/.env
```

**Windows (PowerShell / CMD):**
```powershell
copy mobile\.env.example mobile\.env
```

Fill in your Firebase Web App configuration values:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

2. Install dependencies and start the app:

```bash
cd mobile
npm install
npm start
```

## Automatic & Manual Database Seeding

- **Automatic on App Launch**: When the React Native app starts (`App.tsx`) or performs its first data query, `ensureDatabaseSeeded()` checks if the baseline skills and admin user exist in Firestore. If the database is empty, it automatically seeds all collections (`skills`, `users`, `kyc_verifications`, `bookings`, `bids`, `reviews`, `audit_logs`, and `counters`) and provisions the demo accounts in Firebase Authentication.
- **Standalone CLI Seed**: You can also seed or reset the database anytime from the terminal:

```bash
cd mobile
npm run seed
# Or force re-seed:
npm run seed -- --force
```

## Seed Accounts

The seeder creates 6 demo accounts using the password `password123`:

- Admin: `admin@artisanhub.ng`
- Customer: `amina@gmail.com`
- Customer: `emeka@gmail.com`
- Artisan: `tunde@plumbing.ng`
- Artisan: `ibrahim@sparks.ng`
- Artisan: `chidi@woodcraft.ng`
