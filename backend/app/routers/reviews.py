from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Booking, Bid, BidStatus, Review, ArtisanProfile, BookingStatus, UserRole
from app.schemas import ReviewCreate, ReviewResponse
from app.auth import get_current_user, require_roles, log_action

router = APIRouter(prefix="/api/reviews", tags=["Reviews & Star Rating System"])

@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(
    review_in: ReviewCreate,
    current_user: User = Depends(require_roles([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == review_in.booking_id, Booking.customer_id == current_user.id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found or not owned by current customer.")

    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only review completed bookings.")

    existing_review = db.query(Review).filter(Review.booking_id == review_in.booking_id).first()
    if existing_review:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A review has already been submitted for this booking.")

    accepted_bid = db.query(Bid).filter(Bid.booking_id == booking.id, Bid.status == BidStatus.ACCEPTED).first()
    if not accepted_bid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No accepted artisan found for this booking.")

    artisan_user_id = accepted_bid.artisan_id

    review = Review(
        booking_id=booking.id,
        customer_id=current_user.id,
        artisan_id=artisan_user_id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # Recalculate Artisan Profile Rating Aggregate
    artisan_profile = db.query(ArtisanProfile).filter(ArtisanProfile.user_id == artisan_user_id).first()
    if artisan_profile:
        avg_res = db.query(func.avg(Review.rating), func.count(Review.id)).filter(Review.artisan_id == artisan_user_id).first()
        if avg_res and avg_res[0] is not None:
            artisan_profile.rating_avg = round(float(avg_res[0]), 1)
            artisan_profile.rating_count = int(avg_res[1])
            db.commit()

    log_action(db, current_user.id, "REVIEW_SUBMITTED", f"Customer rated Artisan #{artisan_user_id} {review_in.rating}/5 stars for booking #{booking.id}")
    return review

@router.get("/artisan/{artisan_user_id}", response_model=List[ReviewResponse])
def get_artisan_reviews(artisan_user_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.artisan_id == artisan_user_id).order_by(Review.created_at.desc()).all()
    return reviews
