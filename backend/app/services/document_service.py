#Dỉrectly work with SQLAlchemy to store and query vector
from sqlalchemy.orm import Session
from app.models.document import Document
from app.schemas.document import ChunkEmbeddingCreate
from sentence_transformers import SentenceTransformer

import os 
import uuid
from shutil import copyfileobj
from fastapi import UploadFile
from app.core.config import settings

# Encode content (or title) text to vector embedding
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def save_chunks_embeddings(db: Session, item: ChunkEmbeddingCreate):
    text_encode = item.content if item.content else item.title
    text_embedding = embedding_model.encode(text_encode).tolist() # Convert numpy array to list for JSON serialization
   
    db_item = Document(
        title=item.title,
        content=item.content,
        embedding=text_embedding,
        user_id=item.user_id,
        file_path=item.file_path,
        file_size=item.file_size
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# Upload file
UPLOAD_DIR = "backend/storage"

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

def save_loaded_file(db: Session, file: UploadFile, user_id: int) -> Document:
    file_extension = os.path.splitext(file.filename)[1]
    file_name = str(uuid.uuid4()) + file_extension
    file_path = os.path.join(UPLOAD_DIR, file_name)
    with open(file_path, "wb") as buffer:
        copyfileobj(file.file, buffer)

    chunk_embedding = ChunkEmbeddingCreate(
        title=file.filename,
        content="",
        file_path=file_path,
        file_size=os.path.getsize(file_path),
        user_id=user_id
    )
    return save_chunks_embeddings(db, chunk_embedding)

def get_user_document(db: Session, user_id: int) -> list[Document]:
    return db.query(Document).filter(Document.user_id == user_id).all()