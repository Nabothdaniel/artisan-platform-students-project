import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from app.models import UserRole, KYCStatus, SkillTestStatus, BookingStatus, BidStatus

# --- AUTH & USER SCHEMAS ---

class UserRegister(BaseModel):
    name: str = Field(..., example="Amina Lawal")
    email: EmailStr = Field(..., example="amina@example.com")
    phone: str = Field(..., example="+2348012345678")
    password: str = Field(..., min_length=6)
    role: UserRole = Field(default=UserRole.CUSTOMER)
    location_name: Optional[str] = "Keffi, Nasarawa State"
    latitude: Optional[float] = 8.8471
    longitude: Optional[float] = 7.8732
    # Optional Artisan fields if registering as artisan
    bio: Optional[str] = None
    trade_category: Optional[str] = "Plumbing"
    hourly_rate: Optional[float] = 2500.0
    years_experience: Optional[int] = 2

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

class ArtisanProfileResponse(BaseModel):
    id: int
    user_id: int
    bio: Optional[str]
    trade_category: str
    hourly_rate: float
    years_experience: int
    is_available: bool
    kyc_status: KYCStatus
    skill_test_status: SkillTestStatus
    nin_bvn_token: Optional[str]
    rating_avg: float
    rating_count: int

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    role: UserRole
    location_name: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    created_at: datetime.datetime
    artisan_profile: Optional[ArtisanProfileResponse] = None

    class Config:
        from_attributes = True

# --- SKILLS & ASSESSMENTS ---

class AssessmentQuestionResponse(BaseModel):
    id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str

    class Config:
        from_attributes = True

class SkillResponse(BaseModel):
    id: int
    name: str
    category: str
    description: Optional[str]
    questions: List[AssessmentQuestionResponse] = []

    class Config:
        from_attributes = True

class QuizAnswerItem(BaseModel):
    question_id: int
    selected_option: str  # 'A', 'B', 'C', or 'D'

class QuizSubmission(BaseModel):
    skill_id: int
    answers: List[QuizAnswerItem]

class QuizResult(BaseModel):
    total_questions: int
    correct_count: int
    score_percentage: float
    passed: bool
    skill_test_status: SkillTestStatus

# --- KYC SCHEMAS ---

class KYCSubmission(BaseModel):
    id_type: str = Field(..., example="NIN")  # "NIN" or "BVN"
    id_token: str = Field(..., example="NIN-98765432101")

class KYCResponse(BaseModel):
    id: int
    artisan_id: int
    id_type: str
    id_token: str
    status: KYCStatus
    notes: Optional[str]
    submitted_at: datetime.datetime
    reviewed_at: Optional[datetime.datetime]

    class Config:
        from_attributes = True

class KYCApprovalRequest(BaseModel):
    approved: bool
    notes: Optional[str] = None

# --- BIDS & BOOKINGS SCHEMAS ---

class BidCreate(BaseModel):
    booking_id: Optional[int] = None
    proposed_price: float
    estimated_hours: int = 2
    notes: Optional[str] = "Ready to resolve issue within 1 hour"

class BidResponse(BaseModel):
    id: int
    booking_id: int
    artisan_id: int
    artisan: Optional[UserResponse] = None
    proposed_price: float
    estimated_hours: int
    notes: Optional[str]
    status: BidStatus
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class BookingCreate(BaseModel):
    skill_id: int
    title: str = Field(..., example="Emergency Pipe Leak Repair")
    description: str = Field(..., example="Water main pipe burst in bathroom requiring immediate repair.")
    address: str = Field(..., example="Highland Avenue, Keffi")
    latitude: Optional[float] = 8.8471
    longitude: Optional[float] = 7.8732
    emergency_level: str = "emergency"  # "low", "medium", "emergency"
    budget: float = 5000.0

class BookingStatusUpdate(BaseModel):
    status: BookingStatus

class BookingResponse(BaseModel):
    id: int
    customer_id: int
    customer: Optional[UserResponse] = None
    skill_id: int
    skill: Optional[SkillResponse] = None
    title: str
    description: str
    address: str
    latitude: float
    longitude: float
    emergency_level: str
    budget: float
    agreed_price: Optional[float]
    status: BookingStatus
    created_at: datetime.datetime
    updated_at: datetime.datetime
    bids: List[BidResponse] = []
    review: Optional["ReviewResponse"] = None

    class Config:
        from_attributes = True

# --- REVIEWS SCHEMAS ---

class ReviewCreate(BaseModel):
    booking_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: int
    booking_id: int
    customer_id: int
    artisan_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime.datetime
    customer: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# --- AUDIT & ADMIN SCHEMAS ---

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    user: Optional[UserResponse] = None
    action: str
    details: Optional[str]
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_users: int
    total_customers: int
    total_artisans: int
    verified_artisans: int
    pending_kyc_count: int
    total_bookings: int
    active_bookings: int
    completed_bookings: int
