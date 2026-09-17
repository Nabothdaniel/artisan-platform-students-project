from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ArtisanProfile, UserRole, KYCStatus, SkillTestStatus
from app.schemas import UserRegister, UserLogin, Token, UserResponse
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user, log_action

router = APIRouter(prefix="/api/auth", tags=["Authentication & Accounts"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )
    
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        name=user_in.name,
        email=user_in.email,
        phone=user_in.phone,
        hashed_password=hashed_pwd,
        role=user_in.role,
        location_name=user_in.location_name or "Keffi, Nasarawa State",
        latitude=user_in.latitude or 8.8471,
        longitude=user_in.longitude or 7.8732
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # If artisan, create profile
    if user_in.role == UserRole.ARTISAN:
        profile = ArtisanProfile(
            user_id=user.id,
            bio=user_in.bio or "Qualified artisan skilled in " + (user_in.trade_category or "trades"),
            trade_category=user_in.trade_category or "Plumbing",
            hourly_rate=user_in.hourly_rate or 2500.0,
            years_experience=user_in.years_experience or 1,
            kyc_status=KYCStatus.UNSUBMITTED,
            skill_test_status=SkillTestStatus.PENDING
        )
        db.add(profile)
        db.commit()
        db.refresh(user)

    log_action(db, user.id, "USER_REGISTER", f"User {user.name} ({user.role.value}) registered.")
    return user

@router.post("/login", response_model=Token)
def login_user(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    log_action(db, user.id, "USER_LOGIN", f"User {user.email} logged in.")
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role.value,
        user_id=user.id,
        name=user.name
    )

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role.value,
        user_id=user.id,
        name=user.name
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
