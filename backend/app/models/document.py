# models.py
from sqlalchemy import Column, Integer, String, Text, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.core.database import Base
from app.core.config import settings

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    file_path = Column(String(255), nullable=True) # Optional: Store file path if needed
    file_size = Column(Integer, nullable = True)

    user_id = Column(Integer, ForeignKey("users.id", on_delete = "CASCADE"), nullable = False) # Foreign key to associate with User

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Define fixed dimension vector column
    embedding = Column(Vector(settings.VECTOR_DIMENSION), nullable=True)

    user = relationship("User", back_populates="documents")