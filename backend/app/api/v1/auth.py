from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.user_account import UserAccount
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, GoogleLoginRequest

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
def register(user: UserRegister, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user.email).first()
    if not user:
        user = User(email=user.email, username = user.username, password = user.password)

    direct_account = db.query(UserAccount).filter(UserAccount.user_id == user.id and UserAccount.provider == "direct").first()
    if direct_account:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This account has been registered already.")
    else:
        direct_account = UserAccount(user_id=user.id, provider="direct", provider_id=None)

    user.accounts.append(direct_account)

    db.add(user)
    
    db.commit()
    db.refresh(user)
    db.refresh(direct_account)

    access_token = create_access_token(data={"sub": str(user.id)})
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
        id_info = id_token.verify_oauth2_token(request.token, requests.Request(), settings.GOOGLE_CLIENT_ID)
        email = id_info.get("email")
        username = id_info.get("name", "")

        if not email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google token does not contain email")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, username=username, password=None)

    google_account = db.query(UserAccount).filter(UserAccount.user_id == user.id and UserAccount.provider == "google").first()
    if not google_account:
        google_account = UserAccount(user_id=user.id, provider="google", provider_id=id_info.get("sub"))
    
    user.accounts.append(google_account)
    db.add(user)
    db.commit()
    db.refresh(user)
    db.refresh(google_account)


    access_token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=access_token, token_type="bearer")