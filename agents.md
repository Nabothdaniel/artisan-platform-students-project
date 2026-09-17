# Agent Guidelines for Artisan Hub Project

Welcome to the Artisan Hub project! This document provides essential context and instructions for AI agents working on this codebase.

## 📁 Project Structure

This is a monorepo containing a FastAPI backend and an Expo/React Native frontend.

- **/backend**: Python FastAPI backend.
  - Core tech: `FastAPI`, `SQLAlchemy`, `Pydantic`.
  - Database: `artisan_hub.db` (SQLite for local development).
  - Main entry point: `app/main.py` (typically run via `uvicorn`).
  - Contains API routes, database models, and schemas for auth, artisans, bookings, reviews, and admin modules.
- **/mobile**: Expo/React Native mobile frontend.
  - Core tech: `React Native`, `Expo`, `TypeScript`.
  - Services: `/mobile/src/services/api.ts` handles API calls to the backend. It dynamically switches between `10.0.2.2` (for Android emulators) and `127.0.0.1` (for iOS/Web).
- **Docs**: `DESIGN_AND_IMPLEMENTATION_OF_an_artisans_hiring_app.docx` contains the core design, architecture, and requirements for the app.

## 🛠️ Development Setup & Execution

### Backend
1. `cd backend`
2. Create and activate a virtual environment: `python -m venv venv` and `source venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Run server: `uvicorn app.main:app --reload` (Runs on `http://127.0.0.1:8000`)

### Frontend
1. `cd mobile`
2. Install dependencies: `npm install` (or `yarn install` / `npx expo install`)
3. Start the bundler: `npm start` or `npx expo start`

## ⚠️ Important Rules for Agents

1. **API Integration**: When working on the frontend, always check `api.ts` to ensure endpoints map exactly to the FastAPI backend routes. Do not hardcode `localhost` in components; always use the `api` service.
2. **Database Migrations**: Be careful with `artisan_hub.db`. If you modify SQLAlchemy models in `/backend/app/models/`, ensure that the local SQLite database reflects these changes (drop and recreate tables or use alembic if set up).
3. **Typing**: The mobile frontend uses TypeScript. Maintain strict typing for API responses and component props.
4. **Platform Differences**: Remember that Android emulators cannot reach the host machine via `127.0.0.1`. The codebase already handles this in `api.ts` by using `10.0.2.2` for Android. Preserve this logic.
5. **Testing**: When making changes to the backend, utilize the existing `test_api.py` and `test_all_endpoints.py` files to verify your changes.
