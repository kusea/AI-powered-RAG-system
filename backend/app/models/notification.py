from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy.orm import relationship

class Notification(Base):
    __tablename__ = "notification"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    text = Column(String(500), nullable=False)
    type = Column(String(20), default="received", nullable=False)
    seen = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default = func.now())

    user = relationship("User", back_populates = "notifications")