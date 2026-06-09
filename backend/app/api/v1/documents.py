#Router to define endpoints when frontend call to backend for data
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.document import ChunkEmbeddingResponse
from app.services import document_service

router = APIRouter()

@router.post("/", response_model = ChunkEmbeddingResponse)
def create_document_embedding(item: ChunkEmbeddingResponse, db: Session = Depends(get_db)):
    return document_service.save_chunks_embeddings(db, item)