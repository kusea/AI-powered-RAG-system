# schemas.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChunkEmbeddingBase(BaseModel):
    title: str
    content: Optional[str] = None
    user_id: int
    file_path: Optional[str] = None
    file_size: Optional[int] = None

class ChunkEmbeddingCreate(ChunkEmbeddingBase):
    pass

class ChunkEmbeddingResponse(ChunkEmbeddingBase):
    id: int
    embedding: Optional[List[float]] = None

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: int
    title: str 
    content: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    user_id: int
    created_at: datetime

    class Config: 
        from_attributes = True

class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]