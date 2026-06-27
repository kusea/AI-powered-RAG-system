from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.chat import ChatQueryRequest, ChatQueryStream
from app.services import rag_service
from app.schemas.document import ChunkEmbeddingResponse
from app.models import ChatSession, ChatMessage, User
from app.core.security import get_current_user

router = APIRouter()

# Search for similar semantic words, chunks based on cosine similarity of embeddings
@router.post("/search", response_model = List[ChunkEmbeddingResponse])
def search_vector(request: ChatQueryRequest, db: Session = Depends(get_db)): 
    return rag_service.search_similar_embeddings(db, request.query, request.limit)

@router.post("/query")
async def query(request: ChatQueryStream, db: Session = Depends(get_db)):
    return StreamingResponse(
        rag_service.generate_chat_stream(db, request.query, request.document_ids),
        media_type = "text/event-stream"
)

@router.get("/sessions")
def get_chat_session(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(ChatSession).filter(ChatSession.user_id == user.id).order_by(ChatSession.created_at.desc()).all()

@router.post("/sessions")
def create_chat_session(title: str, user_id: int, db: Session = Depends(get_db)):
    new_session= ChatSession(user_id = user_id, title = title)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: int, db: Session = Depends(get_db)):
    return db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
