from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db

class ProfileUpdater(BaseModel):
    email: EmailStr
    username: str

router = APIRouter()


