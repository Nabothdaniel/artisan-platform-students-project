import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ArtisanProfile, KYCVerification, KYCStatus, UserRole
from app.schemas import KYCSubmission, KYCResponse, KYCApprovalRequest
from app.auth import get_current_user, require_roles, log_action

router = APIRouter(prefix="/api/kyc", tags=["KYC & Identity Verification Gate"])

@router.post("/submit", response_model=KYCResponse)
def submit_kyc_token(
    kyc_in: KYCSubmission,
    current_user: User = Depends(require_roles([UserRole.ARTISAN])),
    db: Session = Depends(get_db)
):
    profile = current_user.artisan_profile
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artisan profile not found.")

    if not kyc_in.id_token or len(kyc_in.id_token.strip()) < 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid NIN or BVN verification token string.")

    kyc_entry = KYCVerification(
        artisan_id=profile.id,
        id_type=kyc_in.id_type.upper(),
        id_token=kyc_in.id_token,
        status=KYCStatus.PENDING,
        submitted_at=datetime.datetime.utcnow()
    )
    db.add(kyc_entry)

    profile.kyc_status = KYCStatus.PENDING
    profile.nin_bvn_token = kyc_in.id_token
    db.commit()
    db.refresh(kyc_entry)

    log_action(db, current_user.id, "KYC_TOKEN_SUBMITTED", f"Artisan submitted {kyc_in.id_type} token: {kyc_in.id_token}")
    return kyc_entry

@router.get("/status", response_model=List[KYCResponse])
def get_my_kyc_history(
    current_user: User = Depends(require_roles([UserRole.ARTISAN])),
    db: Session = Depends(get_db)
):
    profile = current_user.artisan_profile
    if not profile:
        return []
    return profile.kyc_submissions

@router.get("/pending", response_model=List[KYCResponse])
def get_pending_kyc_requests(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    submissions = db.query(KYCVerification).filter(KYCVerification.status == KYCStatus.PENDING).all()
    return submissions

@router.post("/approve/{kyc_id}", response_model=KYCResponse)
def approve_or_reject_kyc(
    kyc_id: int,
    approval: KYCApprovalRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    kyc_entry = db.query(KYCVerification).filter(KYCVerification.id == kyc_id).first()
    if not kyc_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KYC submission record not found.")

    new_status = KYCStatus.APPROVED if approval.approved else KYCStatus.REJECTED
    kyc_entry.status = new_status
    kyc_entry.notes = approval.notes
    kyc_entry.reviewed_at = datetime.datetime.utcnow()

    profile = kyc_entry.artisan_profile
    if profile:
        profile.kyc_status = new_status

    db.commit()
    db.refresh(kyc_entry)

    log_action(
        db,
        current_user.id,
        "KYC_REVIEWED",
        f"Admin reviewed KYC #{kyc_id} for Artisan #{profile.user_id if profile else 'N/A'}. Result: {new_status.value}"
    )
    return kyc_entry
