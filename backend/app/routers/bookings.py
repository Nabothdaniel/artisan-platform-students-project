from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Booking, Bid, Skill, BookingStatus, BidStatus, UserRole, KYCStatus, SkillTestStatus
from app.schemas import BookingCreate, BookingResponse, BidCreate, BidResponse, BookingStatusUpdate
from app.auth import get_current_user, get_current_user_optional, require_roles, log_action

router = APIRouter(prefix="/api/bookings", tags=["Service Bookings & Negotiable Bids"])

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking_request(
    booking_in: BookingCreate,
    current_user: User = Depends(require_roles([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == booking_in.skill_id).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill category not found.")

    booking = Booking(
        customer_id=current_user.id,
        skill_id=booking_in.skill_id,
        title=booking_in.title,
        description=booking_in.description,
        address=booking_in.address,
        latitude=booking_in.latitude or current_user.latitude or 8.8471,
        longitude=booking_in.longitude or current_user.longitude or 7.8732,
        emergency_level=booking_in.emergency_level,
        budget=booking_in.budget,
        status=BookingStatus.REQUESTED
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    log_action(db, current_user.id, "BOOKING_CREATED", f"Customer {current_user.name} created booking '{booking.title}' (ID #{booking.id})")
    return booking

@router.get("", response_model=List[BookingResponse])
def list_bookings(
    status: Optional[BookingStatus] = None,
    my_jobs: bool = False,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(Booking)

    if my_jobs and current_user:
        if current_user.role == UserRole.CUSTOMER:
            query = query.filter(Booking.customer_id == current_user.id)
        elif current_user.role == UserRole.ARTISAN:
            # Bookings where artisan placed a bid
            artisan_bid_booking_ids = db.query(Bid.booking_id).filter(Bid.artisan_id == current_user.id).subquery()
            query = query.filter(Booking.id.in_(artisan_bid_booking_ids))

    if status:
        query = query.filter(Booking.status == status)

    return query.order_by(Booking.created_at.desc()).all()

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking_detail(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking request not found.")
    return booking

@router.post("/{booking_id}/bids", response_model=BidResponse)
def submit_negotiable_bid(
    booking_id: int,
    bid_in: BidCreate,
    current_user: User = Depends(require_roles([UserRole.ARTISAN])),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking request not found.")

    if bid_in.booking_id is not None and bid_in.booking_id != booking_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking ID in URL and request body do not match.")

    if booking.status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot place bid on closed/completed job.")

    profile = current_user.artisan_profile
    if not profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Artisan profile missing.")

    existing_bid = db.query(Bid).filter(Bid.booking_id == booking_id, Bid.artisan_id == current_user.id).first()
    if existing_bid:
        existing_bid.proposed_price = bid_in.proposed_price
        existing_bid.estimated_hours = bid_in.estimated_hours
        existing_bid.notes = bid_in.notes
        db.commit()
        db.refresh(existing_bid)
        log_action(db, current_user.id, "BID_UPDATED", f"Artisan updated bid to ₦{bid_in.proposed_price} on booking #{booking_id}")
        return existing_bid

    bid = Bid(
        booking_id=booking_id,
        artisan_id=current_user.id,
        proposed_price=bid_in.proposed_price,
        estimated_hours=bid_in.estimated_hours,
        notes=bid_in.notes,
        status=BidStatus.PENDING
    )
    db.add(bid)

    if booking.status == BookingStatus.REQUESTED:
        booking.status = BookingStatus.BIDDING_OPEN

    db.commit()
    db.refresh(bid)

    log_action(db, current_user.id, "BID_SUBMITTED", f"Artisan {current_user.name} placed ₦{bid_in.proposed_price} bid on booking #{booking_id}")
    return bid

@router.post("/{booking_id}/accept-bid/{bid_id}", response_model=BookingResponse)
def accept_artisan_bid(
    booking_id: int,
    bid_id: int,
    current_user: User = Depends(require_roles([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.customer_id == current_user.id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found or not owned by current customer.")

    bid = db.query(Bid).filter(Bid.id == bid_id, Bid.booking_id == booking_id).first()
    if not bid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bid not found for this booking.")

    # Mark chosen bid as ACCEPTED, others as REJECTED
    all_bids = db.query(Bid).filter(Bid.booking_id == booking_id).all()
    for b in all_bids:
        if b.id == bid.id:
            b.status = BidStatus.ACCEPTED
        else:
            b.status = BidStatus.REJECTED

    booking.agreed_price = bid.proposed_price
    booking.status = BookingStatus.ACCEPTED
    db.commit()
    db.refresh(booking)

    log_action(db, current_user.id, "BID_ACCEPTED", f"Customer accepted bid #{bid.id} (₦{bid.proposed_price}) for booking #{booking_id}")
    return booking

@router.put("/{booking_id}/status", response_model=BookingResponse)
def update_booking_status(
    booking_id: int,
    status_in: BookingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    booking.status = status_in.status
    db.commit()
    db.refresh(booking)

    log_action(db, current_user.id, "BOOKING_STATUS_CHANGED", f"Booking #{booking_id} status updated to '{status_in.status.value}' by {current_user.name}")
    return booking
