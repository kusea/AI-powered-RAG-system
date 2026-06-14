#Router to define endpoints when frontend call to backend for data
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.document import ChunkEmbeddingResponse, DocumentResponse

import os;
from app.services import document_service;
from typing import List

from app.core.security import get_current_user
from app.models.user import User


router = APIRouter()

@router.post("/", response_model = ChunkEmbeddingResponse)
def create_document_embedding(item: ChunkEmbeddingResponse, db: Session = Depends(get_db)):
    return document_service.save_chunks_embeddings(db, item)

@router.post("/upload", response_model = DocumentResponse)
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    allowed_extensions = [".pdf", ".docx", ".txt", ".pptx", ".xlsx", ".csv", ".html", ".xls"]
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST, 
            detail = "Invalid file type. Only PDF, DOCX, TXT, PPTX, XLSX, CSV, HTML, XLS files are allowed.")

    try:
        return document_service.save_loaded_file(db, file, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail = f"An error occurred while saving the file: {str(e)}"
        )
    
@router.get("/", response_model = List[DocumentResponse])
def list_document(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return document_service.get_user_document(db, current_user.id)
