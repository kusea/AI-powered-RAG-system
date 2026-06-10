#Structure for the chat streaming and vector query requests
from pydantic import BaseModel, Field

class ChatQueryRequest(BaseModel):
    query: str
    limit: int = Field(5, ge = 1, le = 100)