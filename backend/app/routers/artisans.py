from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ArtisanProfile, UserRole, KYCStatus, SkillTestStatus
from app.schemas import UserResponse, ArtisanProfileResponse
from app.auth import get_current_user, require_roles, log_action

router = APIRouter(prefix="/api/artisans", tags=["Artisan Directory & Discovery"])

@router.get("", response_model=List[UserResponse])
def search_artisans(
    trade_category: Optional[str] = None,
    verified_only: bool = False,
    search: Optional[str] = None,
    min_rating: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(User).join(ArtisanProfile).filter(User.role == UserRole.ARTISAN)

    if trade_category:
        query = query.filter(ArtisanProfile.trade_category.ilike(f"%{trade_category}%"))
    
    if verified_only:
        query = query.filter(
            ArtisanProfile.kyc_status == KYCStatus.APPROVED,
            ArtisanProfile.skill_test_status == SkillTestStatus.PASSED
        )
    
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) | 
            (ArtisanProfile.bio.ilike(f"%{search}%")) |
            (User.location_name.ilike(f"%{search}%"))
        )
    
    if min_rating is not None:
        query = query.filter(ArtisanProfile.rating_avg >= min_rating)

    artisans = query.all()
    return artisans

@router.get("/{user_id}", response_model=UserResponse)
def get_artisan_detail(user_id: int, db: Session = Depends(get_db)):
    artisan = db.query(User).filter(User.id == user_id, User.role == UserRole.ARTISAN).first()
    if not artisan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artisan profile not found."
        )
    return artisan

@router.put("/profile", response_model=ArtisanProfileResponse)
def update_artisan_profile(
    bio: Optional[str] = None,
    trade_category: Optional[str] = None,
    hourly_rate: Optional[float] = None,
    years_experience: Optional[int] = None,
    is_available: Optional[bool] = None,
    current_user: User = Depends(require_roles([UserRole.ARTISAN])),
    db: Session = Depends(get_db)
):
    profile = current_user.artisan_profile
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artisan profile does not exist."
        )

    if bio is not None:
        profile.bio = bio
    if trade_category is not None:
        profile.trade_category = trade_category
    if hourly_rate is not None:
        profile.hourly_rate = hourly_rate
    if years_experience is not None:
        profile.years_experience = years_experience
    if is_available is not None:
        profile.is_available = is_available

    db.commit()
    db.refresh(profile)
    log_action(db, current_user.id, "ARTISAN_PROFILE_UPDATE", "Artisan profile updated.")
    return profile
