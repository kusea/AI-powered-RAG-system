from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key = True, index = True)
    username = Column(String(50), unique = True, nullable = False)
    email = Column(String(255), unique = True, nullable = False, index = True)
    password = Column(String(255), nullable = True)
    hashed_password = Column(String(255), nullable = True)
    is_active = Column(Integer, default = 0) # True for active, False for inactive
    created_at = Column(DateTime(timezone = True), server_default = func.now())

    documents = relationship("Document", back_populates = "user", cascade = "all, delete-orphan")
    accounts = relationship("UserAccount", back_populates = "user", cascade = "all, delete-orphan")
