#Router to define endpoints when frontend call to backend for data
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.document import ChunkEmbeddingResponse, DocumentResponse, DocumentShareResponse, DocumentShareCreate
from pydantic import BaseModel

import os;
from app.services import document_service;
from typing import List

from app.core.security import get_current_user
from app.models import User, Document


router = APIRouter()

@router.post("/", response_model = ChunkEmbeddingResponse)
def create_document_embedding(item: ChunkEmbeddingResponse, db: Session = Depends(get_db)):
    return document_service.save_chunks_embeddings(db, item)

@router.post("/upload", response_model = DocumentResponse)
def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    allowed_extensions = [".pdf", ".docx", ".txt", ".pptx", ".xlsx", ".csv", ".html", ".xls", ".md"]
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST, 
            detail = "Invalid file type. Only PDF, DOCX, TXT, PPTX, XLSX, CSV, HTML, XLS, MD, XLS files are allowed.")
    
    try:
        return document_service.save_loaded_file(db, file, current_user.id, background_tasks)
    except Exception as e:
        print(f"An error occurred while saving the file: {str(e)}")
        raise HTTPException(
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail = f"An error occurred while saving the file: {str(e)}"
        )
    
@router.get("/", response_model = List[DocumentResponse])
def list_document(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return document_service.get_user_document(db, current_user.id) # Use for deleting multiple documents, if only 1 document, pass 1 value into list

class DeleteDocPayload(BaseModel):
    document_ids: List[int]

@router.delete("/delete-document", status_code = status.HTTP_200_OK)
def delete_document(payload: DeleteDocPayload = Body(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return document_service.delete_document(db, payload.document_ids, current_user.id)

class RestoreDocPayload(BaseModel):
    document_ids: List[int]

@router.put("/restore-document", status_code = status.HTTP_200_OK)
def restore_document(payload: RestoreDocPayload = Body(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return document_service.restore_document(db, payload.document_ids, current_user.id)

@router.post("/share", response_model = DocumentShareResponse)
def share_document(document: DocumentShareCreate = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return document_service.shared_document_to_user(document, db, current_user.id)

@router.get("/shared-to-me", response_model = List[DocumentShareResponse])
def shared_to_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return document_service.get_shared_document(db, current_user.id)

@router.get("/trash", status_code = status.HTTP_200_OK)
def get_trash_document(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return document_service.get_trash_document(db, current_user.id)


@router.get("/{document_id}", response_model = DocumentResponse)
def get_document(db: Session = Depends(get_db), document_id: int = None, current_user: User = Depends(get_current_user)):
    return db.query(Document).filter(Document.id == document_id and Document.user_id == current_user.id).first()