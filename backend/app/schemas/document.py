# schemas.py
from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime
import json

class ChunkEmbeddingBase(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    user_id: Optional[int] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    document_id: Optional[int] = None

class ChunkEmbeddingCreate(ChunkEmbeddingBase):
    pass

class ChunkEmbeddingResponse(ChunkEmbeddingBase):
    id: int
    embedding: Optional[List[float]] = None

    class Config:
        from_attributes = True

class DocumentInsightResponse(BaseModel):
    id: int
    document_id: int
    summary: Optional[str] = ""
    key_points: Optional[List[str]] = []
    key_words: Optional[List[str]] = []

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: int
    title: str 
    content: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    user_id: Optional[int] = None
    created_at: datetime
    is_shared: Optional[bool] = False
    embedding: Optional[List[float]] = None

    class Config: 
        from_attributes = True

class DocumentShareCreate(BaseModel):
    document_id: int
    shared_to_email: EmailStr
    permission: str = "read"

class DocumentShareResponse(BaseModel):
    id: int
    document_id: int
    shared_by_id: int
    shared_to_id: int
    permission: str
    created_at: datetime

    class Config:
        from_attributes = True