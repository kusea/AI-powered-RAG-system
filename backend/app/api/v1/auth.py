from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests

from app.core.config import settings
from app.core.database import get_db
from app.models import User, UserAccount
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, GoogleLoginRequest

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        accounts = db.query(UserAccount).filter(UserAccount.user_id == existing_user.id).all()
        if filter(lambda a: a.provider == "direct", accounts):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This account is registered")
        direct_account = UserAccount(user_id=existing_user.id, provider="direct", provider_id=user.email)
        existing_user.accounts.append(direct_account)
        db.add(direct_account)
        db.commit()
    else:
        new_user = User(email=user.email, username=user.username, password=user.password, hashed_password=hash_password(user.password))
        direct_account = UserAccount(provider="direct", provider_id=user.email)
        new_user.accounts.append(direct_account)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        db.refresh(direct_account)
    
    db_user = db.query(User).filter(User.email == user.email).first() # Take the value saved in the database after refresh
    access_token = create_access_token(data={"sub": str(db_user.id)})
    return TokenResponse(access_token=access_token, token_type="bearer")

@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email")
    
    if not db_user.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This account is registered on other providers.")
    
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid password")

    access_token = create_access_token(data={"sub": str(db_user.id)})
    return TokenResponse(access_token=access_token, token_type="bearer")

@router.post("/google-login", response_model=TokenResponse)
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        id_info = id_token.verify_oauth2_token(
            request.token, 
            requests.Request(), 
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds = 60
        )
        email = id_info.get("email")
        username = id_info.get("name", "")

        if not email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google token does not contain email")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, username=username)
        google_account = UserAccount(provider="google", provider_id=id_info["sub"])
        user.accounts.append(google_account)
        db.add(user)
        db.commit()
        db.refresh(user)
        db.refresh(google_account)
    else:
        has_google = any(account.provider == "google" for account in user.accounts)
        if not has_google:
            google_account = UserAccount(provider="google", provider_id=id_info["sub"])
            user.accounts.append(google_account)
            db.add(google_account)
            db.commit()
            db.refresh(google_account)

    user = db.query(User).filter(User.email == email).first() # Take the value saved in the database after refresh
    access_token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=access_token, token_type="bearer")