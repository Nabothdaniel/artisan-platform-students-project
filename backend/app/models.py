import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    ARTISAN = "artisan"
    ADMIN = "admin"

class KYCStatus(str, enum.Enum):
    UNSUBMITTED = "unsubmitted"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class SkillTestStatus(str, enum.Enum):
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"

class BookingStatus(str, enum.Enum):
    REQUESTED = "requested"
    BIDDING_OPEN = "bidding_open"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class BidStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    location_name = Column(String(150), default="Keffi, Nasarawa State")
    latitude = Column(Float, default=8.8471)
    longitude = Column(Float, default=7.8732)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    artisan_profile = relationship("ArtisanProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bookings_as_customer = relationship("Booking", back_populates="customer", foreign_keys="[Booking.customer_id]")
    bids = relationship("Bid", back_populates="artisan")
    reviews_given = relationship("Review", back_populates="customer", foreign_keys="[Review.customer_id]")
    reviews_received = relationship("Review", back_populates="artisan", foreign_keys="[Review.artisan_id]")
    audit_logs = relationship("AuditLog", back_populates="user")

class ArtisanProfile(Base):
    __tablename__ = "artisan_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    trade_category = Column(String(100), nullable=False, default="General Maintenance")
    hourly_rate = Column(Float, default=2500.0)  # NGN
    years_experience = Column(Integer, default=1)
    is_available = Column(Boolean, default=True)
    
    # Verification Gates
    kyc_status = Column(SQLEnum(KYCStatus), default=KYCStatus.UNSUBMITTED, nullable=False)
    skill_test_status = Column(SQLEnum(SkillTestStatus), default=SkillTestStatus.PENDING, nullable=False)
    nin_bvn_token = Column(String(100), nullable=True)
    
    # Aggregates
    rating_avg = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)

    user = relationship("User", back_populates="artisan_profile")
    kyc_submissions = relationship("KYCVerification", back_populates="artisan_profile", cascade="all, delete-orphan")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    questions = relationship("AssessmentQuestion", back_populates="skill", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="skill")

class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    option_a = Column(String(255), nullable=False)
    option_b = Column(String(255), nullable=False)
    option_c = Column(String(255), nullable=False)
    option_d = Column(String(255), nullable=False)
    correct_option = Column(String(1), nullable=False)  # 'A', 'B', 'C', or 'D'

    skill = relationship("Skill", back_populates="questions")

class KYCVerification(Base):
    __tablename__ = "kyc_verifications"

    id = Column(Integer, primary_key=True, index=True)
    artisan_id = Column(Integer, ForeignKey("artisan_profiles.id"), nullable=False)
    id_type = Column(String(20), nullable=False)  # "NIN" or "BVN"
    id_token = Column(String(100), nullable=False)
    status = Column(SQLEnum(KYCStatus), default=KYCStatus.PENDING, nullable=False)
    notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    artisan_profile = relationship("ArtisanProfile", back_populates="kyc_submissions")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, default=8.8471)
    longitude = Column(Float, default=7.8732)
    emergency_level = Column(String(20), default="medium")  # "low", "medium", "emergency"
    budget = Column(Float, nullable=False)
    agreed_price = Column(Float, nullable=True)
    status = Column(SQLEnum(BookingStatus), default=BookingStatus.REQUESTED, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    customer = relationship("User", back_populates="bookings_as_customer", foreign_keys=[customer_id])
    skill = relationship("Skill", back_populates="bookings")
    bids = relationship("Bid", back_populates="booking", cascade="all, delete-orphan")
    review = relationship("Review", back_populates="booking", uselist=False, cascade="all, delete-orphan")

class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    artisan_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    proposed_price = Column(Float, nullable=False)
    estimated_hours = Column(Integer, default=2)
    notes = Column(Text, nullable=True)
    status = Column(SQLEnum(BidStatus), default=BidStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    booking = relationship("Booking", back_populates="bids")
    artisan = relationship("User", back_populates="bids")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, unique=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    artisan_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    booking = relationship("Booking", back_populates="review")
    customer = relationship("User", back_populates="reviews_given", foreign_keys=[customer_id])
    artisan = relationship("User", back_populates="reviews_received", foreign_keys=[artisan_id])

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
