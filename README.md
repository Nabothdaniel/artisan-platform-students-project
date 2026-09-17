# ArtisanHub

ArtisanHub is a service marketplace for connecting customers with verified local artisans. Customers can post jobs, receive negotiable bids, accept an artisan, track job status, and submit reviews. Artisans can manage their profiles, complete skill assessments, submit KYC information, and bid on available jobs. Administrators can review KYC submissions and inspect platform activity.

This repository contains:

- `backend/`: FastAPI API with SQLAlchemy models and JWT authentication.
- `mobile/`: Expo and React Native client for Android, iOS, and web.
- `scripts/start-dev.sh`: local launcher for the backend and Expo development server.
- `render.yaml`: Render configuration for deploying the backend.

## Requirements

- Python 3.10 or newer
- Node.js and npm
- Expo CLI through the local mobile dependencies
- A device, emulator, or browser for the Expo client

## Quick Start

From the repository root:

```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

The API starts at `http://127.0.0.1:8000` and Expo starts its development server. The API documentation is available at `http://127.0.0.1:8000/docs`.

To start each service independently, use the focused setup below.

## Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Run the backend tests with:

```bash
cd backend
source venv/bin/activate
python -m unittest -q test_all_endpoints.py
```

The test suite recreates and seeds the local database. Do not run it against a shared or production database.

### Backend Environment Variables

The backend reads these variables from the environment:

| Variable | Purpose | Default |
| --- | --- | --- |
| `SECRET_KEY` | JWT signing key | Development fallback only |
| `DATABASE_URL` | SQLAlchemy database URL | `sqlite:///./artisan_hub.db` |
| `CORS_ORIGINS` | Comma-separated allowed origins | Local development origins |

For local development, create `backend/.env` only if your environment loader or shell setup requires it. Never commit secrets or local database files. In production, always set a strong `SECRET_KEY` and use a managed Postgres database through `DATABASE_URL`.

## Mobile Setup

```bash
cd mobile
npm install
npm start
```

Useful Expo commands:

```bash
npm run android
npm run ios
npm run web
```

Check the TypeScript project with:

```bash
cd mobile
npx tsc --noEmit --pretty false
```

The client detects the Expo host for physical devices and uses `10.0.2.2` for Android emulators. The backend must be reachable on port `8000` from the device or emulator.

## API Overview

The main API groups are:

- `/api/auth`: registration, login, token authentication, and current-user data.
- `/api/artisans`: artisan discovery and profile management.
- `/api/skills`: skill categories and competency quizzes.
- `/api/kyc`: artisan identity verification submissions and admin approval.
- `/api/bookings`: customer jobs, artisan bids, bid acceptance, and status changes.
- `/api/reviews`: completed-job reviews and artisan rating aggregates.
- `/api/admin`: dashboard statistics and audit logs.
- `/api/health`: service health check.

Interactive API documentation is available at `/docs` when the backend is running.

## Seed Accounts

The seed script creates demo accounts using the password `password123`:

- Admin: `admin@artisanhub.ng`
- Customer: `amina@gmail.com`
- Customer: `emeka@gmail.com`
- Artisan: `tunde@plumbing.ng`
- Artisan: `ibrahim@sparks.ng`
- Artisan: `chidi@woodcraft.ng`

These credentials are for local development only.

## Render Deployment

The repository includes `render.yaml` for deploying the backend as a Render web service.

Before deploying:

1. Connect the repository to Render and use the Blueprint configuration.
2. Replace the placeholder frontend origin in `render.yaml` with the real deployed client origin.
3. Configure a managed Postgres database and set its connection string as `DATABASE_URL`.
4. Confirm `SECRET_KEY` is generated or set to a secure value.
5. Keep `CORS_ORIGINS` limited to the actual client and required local development origins.

The Render service binds to Render's `$PORT` value and exposes the FastAPI app through `app.main:app`. SQLite data stored on a Render web service is not a reliable production datastore because local service storage is not intended for durable application data.

## Repository Hygiene

The root `.gitignore` excludes environment files, virtual environments, Python caches, SQLite databases, `node_modules`, Expo output, build artifacts, editor settings, logs, and local design scratch files. Commit source code, dependency manifests, configuration templates, and required app assets only.

## Project Status

ArtisanHub is an active student project. Before production launch, review authentication settings, database migrations, CORS policy, file storage, rate limiting, observability, and privacy handling for KYC data.
