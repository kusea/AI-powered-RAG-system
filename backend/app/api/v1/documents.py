#Router to define endpoints when frontend call to backend for data
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.document import ChunkEmbeddingResponse, DocumentResponse, DocumentShareResponse, DocumentShareCreate
from pydantic import BaseModel

import os;
from app.services import document_service, rag_service
from typing import List

from app.core.security import get_current_user
from app.models import User, Document, DocumentShare


router = APIRouter()

@router.post("/", response_model = ChunkEmbeddingResponse)
def create_document_embedding(item: ChunkEmbeddingResponse, db: Session = Depends(get_db)):
    return document_service.save_chunks_embeddings(db, item)

@router.post("/upload", response_model = DocumentResponse)
def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    allowed_extensions = [".pdf", ".docx", ".txt", ".pptx", ".xlsx", ".csv", ".html", ".xls", ".md", ".png", ".jpg", ".jpeg"]
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST, 
            detail = "Invalid file type. Only PDF, DOCX, TXT, PPTX, XLSX, CSV, HTML, XLS, MD, XLSX, JPG, JPEG, PNG files are allowed.")
    
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
async def share_document(document: DocumentShareCreate = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await document_service.shared_document_to_user(document, db, current_user.id)

class DocumentSharePayload(BaseModel):
    id: int
    title: str
    shared_by: str
    share_to: str
    permission: str
    shared_at: str

@router.get("/shared-by-me", response_model = List[DocumentSharePayload])
def shared_by_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return document_service.get_shared_document(db, current_user.id, DocumentShare.shared_by_id == current_user.id)

@router.get("/shared-to-me", response_model = List[DocumentSharePayload])
def shared_to_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return document_service.get_shared_document(db, current_user.id, DocumentShare.shared_to_id == current_user.id)

@router.get("/trash", status_code = status.HTTP_200_OK)
def get_trash_document(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return document_service.get_trash_document(db, current_user.id)

@router.get("/all", status_code = status.HTTP_200_OK)
def get_all_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    own_docs = db.query(Document).filter(Document.user_id == current_user.id, Document.deleted_at == None).all()
    shared_docs = db.query(DocumentShare).filter(DocumentShare.shared_to_id == current_user.id).all()

    result = []
    for doc in own_docs:
        result.append({
            "id": doc.id,
            "title": doc.title,
            "file_size": doc.file_size,
            "created_at": doc.created_at.isoformat(),
            "is_shared": False,
        })

    for share in shared_docs:
        if share.document and share.document.deleted_at == None:
            result.append({
                "id": share.document.id,
                "title": share.document.title,
                "file_size": share.document.file_size,
                "created_at": share.document.created_at.isoformat(),
                "is_shared": True,
                "owner_email": share.document.user.email
            })

    result = sorted(result, key=lambda x: x["created_at"], reverse=True)
    return result


@router.get("/{document_id}", response_model = DocumentResponse)
async def get_document(db: Session = Depends(get_db), document_id: int = None, current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id and Document.user_id == current_user.id and Document.deleted_at == None).first()
    if not doc:
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, detail = "Document not found in your account's storage.")
    
    insights = await rag_service.generate_document_summary(doc.content)

    return DocumentResponse(
        id = doc.id,
        title = doc.title,
        file_size = doc.file_size,
        file_path = doc.file_path,
        created_at = doc.created_at,
        content = doc.content,
        user_id = doc.user_id,
        insights= insights
    )