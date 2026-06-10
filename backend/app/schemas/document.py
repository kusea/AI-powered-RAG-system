# schemas.py
from pydantic import BaseModel
from typing import List, Optional

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