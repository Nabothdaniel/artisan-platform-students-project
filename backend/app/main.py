from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers.auth import router as auth_router
from app.routers.artisans import router as artisans_router
from app.routers.skills import router as skills_router
from app.routers.kyc import router as kyc_router
from app.routers.bookings import router as bookings_router
from app.routers.reviews import router as reviews_router
from app.routers.admin import router as admin_router

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="""
    ## ArtisanHub API
    A digital platform designed to bridge the communication and security gap between urban consumers and local informal trade workers (artisans) in developing urban markets.
    
    ### Core Systems:
    * **Role Authorization**: Customer, Artisan, Administrator.
    * **Identity Verification (KYC)**: NIN/BVN token submission & administrative approval gate.
    * **Skill Competency Assessment Module**: Trade-specific competency testing.
    * **Negotiable Bidding & Booking Workflow**: Request creation -> Artisan price bid -> Customer acceptance -> Job completion.
    * **Reviews & Star Rating**: 1-5 Star user feedback and dynamic aggregate calculations.
    * **Administrative Audit Trail**: Comprehensive audit logging and system dashboard stats.
    """
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(artisans_router)
app.include_router(skills_router)
app.include_router(kyc_router)
app.include_router(bookings_router)
app.include_router(reviews_router)
app.include_router(admin_router)

@app.get("/", tags=["Health Check"])
def root_status():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "docs_url": "/docs"
    }

@app.get("/api/health", tags=["Health Check"])
def health_check():
    return {"status": "ok", "message": "ArtisanHub Backend is running smoothly."}
