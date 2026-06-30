from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.chat import ChatQueryRequest, ChatQueryStream
from app.services import rag_service
from app.schemas.document import ChunkEmbeddingResponse
from app.models import ChatSession, ChatMessage, User
from app.core.security import get_current_user
from pydantic import BaseModel

router = APIRouter()

# Search for similar semantic words, chunks based on cosine similarity of embeddings
@router.post("/search", response_model = List[ChunkEmbeddingResponse])
def search_vector(request: ChatQueryRequest, db: Session = Depends(get_db)): 
    return rag_service.search_similar_embeddings(db, request.query, request.limit)

@router.post("/query")
async def query(request: ChatQueryStream, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    print(f"REQUEST_QUERTY: {request.query}")
    session_title = ""
    session_id = request.session_id
    is_new_session = False
    print(f"Current user id: {current_user.id}")
    if not session_id:
        is_new_session = True
        limit_title_length = 30
        session_title = request.query[:limit_title_length] + "..." if len(request.query) > limit_title_length else request.query
        
        print(f"Session title: {session_title}")
        
        new_session= ChatSession(user_id = current_user.id, title = session_title)
        current_user.chat_sessions.append(new_session)
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        session_id = new_session.id

    user_message = ChatMessage(
        session_id = session_id,
        role = "user",
        content = request.query
    )
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    session.messages.append(user_message)
    db.add(user_message)
    db.commit()

    return StreamingResponse(
        rag_service.generate_chat_stream(db, request.query, request.document_ids, is_new_session, session_id, session_title),
        media_type = "text/event-stream"
    )

@router.get("/sessions")
def get_chat_session(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(ChatSession).filter(ChatSession.user_id == user.id).order_by(ChatSession.created_at.desc()).all()

@router.post("/sessions")
def create_chat_session(title: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    print(f"Current user id: {current_user.id}")
    new_session= ChatSession(user_id = current_user.id, title = title)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: int, db: Session = Depends(get_db)):
    return db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()

class SessionUpdatePayload(BaseModel):
    title: str

@router.put("/sessions/{session_id}", status_code = 200)
def rename_session(session_id: int, payload: SessionUpdatePayload = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id and ChatSession.user_id == current_user.id).first()

    if not session:
        raise HTTPException(status_code = 404, detail = "Session not found")
    
    session.title = payload.title
    db.commit()
    db.refresh(session)
    return {"message": "Session renamed successfully", "session": session}

@router.delete("/sessions/{session_id}", status_code = 200)
def delete_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id and ChatSession.user_id == current_user.id).first()

    if not session:
        raise HTTPException(status_code = 404, detail = "Session not found")
    
    db.delete(session)
    db.commit()
    return {"message": "Session deleted successfully"}
