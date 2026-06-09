#Structure for the chat streaming and vector query requests
from pydantic import BaseModel, Field
from typing import List

class VectorSearchRequest(BaseModel):
    target_vector: List[float] = Field(..., description = "Dimension of the vector must match the embedding dimension used in the database.")
    limit: int = Field(3, ge = 1, le = 20)

class ChatQueryRequest(BaseModel):
    query: str