from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User
from app.core.security import get_current_user

class ProfileUpdater(BaseModel):
    email: EmailStr
    username: str

router = APIRouter()
@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user),db: Session = Depends(get_db)):
    return db.query(User).filter(User.id == current_user.id).first()

@router.put("/me")
def update_profile(profile: ProfileUpdater, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == profile.email).all()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    for us in user:
        us.username = profile.username

    db.commit()
    db.refresh(user)

    return {"message": "Profile updated successfully", "user": {"username": user.username, "email": user.email}}