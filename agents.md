# Agent Guidelines for Artisan Hub Project (Firebase Branch)

Welcome to the Artisan Hub project (`firebase` branch)! This document provides essential context and instructions for AI agents working on this codebase.

## 📁 Project Structure

This branch runs a serverless React Native (Expo) application backed by Firebase Authentication and Cloud Firestore.

- **/mobile**: Expo/React Native mobile frontend.
  - Core tech: `React Native`, `Expo`, `TypeScript`, `Firebase JS SDK` (`firebase/auth`, `firebase/firestore`).
  - Firebase Configuration: `/mobile/src/services/firebase.ts` initializes Firebase from `EXPO_PUBLIC_FIREBASE_*` environment variables (or `app.json` `extra.firebase`).
  - Data & Auth Service: `/mobile/src/services/api.ts` implements all authentication, artisan discovery, skill quiz grading, KYC verification, booking/bidding, review aggregation, and admin dashboard operations against Cloud Firestore and Firebase Auth.
  - Auto-Seeding: `/mobile/src/services/seed.ts` and `/mobile/src/services/seedData.ts` automatically and idempotently seed Cloud Firestore and Firebase Auth on app startup, and `/mobile/scripts/seed-firebase.mjs` provides a CLI seeder (`npm run seed`).

## 🛠️ Development Setup & Execution

1. `cd mobile`
2. Copy `.env.example` to `.env` and populate `EXPO_PUBLIC_FIREBASE_*` credentials.
3. Install dependencies: `npm install`
4. Seed database manually if desired (also runs automatically on app startup): `npm run seed`
5. Start the bundler: `npm start` or `npx expo start`
