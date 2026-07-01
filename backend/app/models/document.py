# models.py
from sqlalchemy import Column, Integer, String, Text, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), unique=True,nullable=False)
    content = Column(Text, nullable=True)
    file_path = Column(String(255), nullable=True) # Optional: Store file path if needed
    file_size = Column(Integer, nullable = True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete = "CASCADE"), nullable = False) # Foreign key to associate with User

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True, default = None)

    user = relationship("User", back_populates="documents")
    chunks = relationship("ChunkDocument", back_populates="document", cascade="all, delete-orphan")
    shares = relationship("DocumentShare", back_populates="document", cascade="all, delete-orphan")

class DocumentShare(Base):
    __tablename__ = "document_shares"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete = "CASCADE"), nullable = False)

    shared_by_id = Column(Integer, ForeignKey("users.id", ondelete = "CASCADE"), nullable = False)
    shared_to_id = Column(Integer, ForeignKey("users.id", ondelete = "CASCADE"), nullable = False)
    
    permission = Column(String(20), default = "read", nullable = False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates = "shares")
    shared_by = relationship("User", foreign_keys = [shared_by_id])
    shared_to = relationship("User", foreign_keys = [shared_to_id])