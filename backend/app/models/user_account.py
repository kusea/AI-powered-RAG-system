from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(Integer, primary_key = True, index = True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete = "CASCADE"), index = True)
    provider = Column(String(255), nullable = False)
    provider_id = Column(String(255), nullable = True)

    user = relationship("User", back_populates = "user_accounts")