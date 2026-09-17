from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ArtisanProfile, Booking, KYCVerification, AuditLog, UserRole, KYCStatus, BookingStatus
from app.schemas import DashboardStats, AuditLogResponse, UserResponse
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/admin", tags=["Administrator & Audit Module"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_customers = db.query(User).filter(User.role == UserRole.CUSTOMER).count()
    total_artisans = db.query(User).filter(User.role == UserRole.ARTISAN).count()
    
    verified_artisans = db.query(ArtisanProfile).filter(ArtisanProfile.kyc_status == KYCStatus.APPROVED).count()
    pending_kyc = db.query(KYCVerification).filter(KYCVerification.status == KYCStatus.PENDING).count()
    
    total_bookings = db.query(Booking).count()
    active_bookings = db.query(Booking).filter(Booking.status.in_([BookingStatus.REQUESTED, BookingStatus.BIDDING_OPEN, BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS])).count()
    completed_bookings = db.query(Booking).filter(Booking.status == BookingStatus.COMPLETED).count()

    return DashboardStats(
        total_users=total_users,
        total_customers=total_customers,
        total_artisans=total_artisans,
        verified_artisans=verified_artisans,
        pending_kyc_count=pending_kyc,
        total_bookings=total_bookings,
        active_bookings=active_bookings,
        completed_bookings=completed_bookings
    )

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(default=50, le=200),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    role: Optional[UserRole] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).all()
