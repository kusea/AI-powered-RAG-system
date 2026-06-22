from sqlalchemy import Column, Integer, Text, ForeignKey 
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.core.database import Base
from app.core.config import settings

class ChunkDocument(Base):
    __tablename__ = "chunk_documents"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(settings.VECTOR_DIMENSION), nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete = "CASCADE"), nullable = False)

    document = relationship("Document", back_populates="chunks")