# schemas.py
from pydantic import BaseModel
from typing import List, Optional

class ChunkEmbeddingBase(BaseModel):
    title: str
    content: Optional[str] = None
    embedding: List[float] # Nhận mảng số thực từ client
    user_id: int

class ChunkEmbeddingCreate(ChunkEmbeddingBase):
    pass

class ChunkEmbeddingResponse(ChunkEmbeddingBase):
    id: int

    class Config:
        from_attributes = True