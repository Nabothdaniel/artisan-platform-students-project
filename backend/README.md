# ArtisanHub FastAPI Backend

FastAPI backend for ArtisanHub—an urban informal labor marketplace & identity background verification system for tradespeople (plumbers, electricians, carpenters, masons, etc.).

## Features
- **JWT Authentication & Role Access**: Separate permissions for Customer, Artisan, and Admin.
- **Identity Verification Gate (KYC)**: NIN/BVN token submission & administrative approval workflow.
- **Skill Competency Assessment Module**: Trade-specific competency testing with score grading.
- **Negotiable Bidding & Booking Workflow**: Customer service request -> Artisan negotiable pricing bid -> Customer acceptance -> Job lifecycle tracking.
- **Review Rating Engine**: 1-5 star ratings with dynamic average calculations.
- **Admin Audit Dashboard**: System statistics and audit logs.

## Setup & Running Locally

1. **Activate Virtual Environment**:
   ```bash
   cd backend
   source venv/bin/activate
   ```

2. **Seed Database**:
   ```bash
   python -m app.seed
   ```

3. **Start FastAPI Development Server**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Access Interactive OpenAPI Specs**:
   - Interactive Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

5. **Run Automated Test Suite**:
   ```bash
   python test_api.py
   ```

## Seed Accounts (Password: `password123`)
- **Admin**: `admin@artisanhub.ng`
- **Customer**: `amina@gmail.com`
- **Customer**: `emeka@gmail.com`
- **Artisan (Plumbing)**: `tunde@plumbing.ng`
- **Artisan (Electrical)**: `ibrahim@sparks.ng`
- **Artisan (Carpentry)**: `chidi@woodcraft.ng`
