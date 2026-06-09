from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.chat import VectorSearchRequest, ChatQueryRequest
from app.services import rag_service
from app.schemas.document import ChunkEmbeddingResponse

router = APIRouter()

# Search for similar semantic words, chunks based on cosine similarity of embeddings
@router.post("/search", response_model = List[ChunkEmbeddingResponse])
def search_vector(request: VectorSearchRequest, db: Session = Depends(get_db)): 
    return rag_service.search_similar_embeddings(db, request.target_vector, request.limit)