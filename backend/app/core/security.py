from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from app.core.config import settings
from passlib.context import CryptContext

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import TokenResponse

pwd_context = CryptContext(schemes = ["bcrypt"], deprecated = "auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


# Dependency to get user from token in header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(db: Session = Depends(get_db), token_header: str = Depends(oauth2_scheme), request: Request = None):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = token_header
    if not token:
        token = request.query_params.get("token")

    if not token or token == "undefined":
        print("Token not found")
        raise credentials_exception

    try:
        jwt_decode = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = jwt_decode.get("sub")
        print(f"----------------user_id: {user_id}----------------------")
        if not user_id: 
            print ("Username not found in token")
            raise credentials_exception
    except JWTError:
        print ("Invalid token")
        raise credentials_exception
    
    print(f"decoded token: {jwt_decode}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        print ("User not found in database")
        raise credentials_exception

    return user