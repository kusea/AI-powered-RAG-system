#Dỉrectly work with SQLAlchemy to store and query vector
from sqlalchemy.orm import Session
from app.models import Document
from app.schemas.document import ChunkEmbeddingCreate
from sentence_transformers import SentenceTransformer

import os 
import uuid
from shutil import copyfileobj
from fastapi import UploadFile, HTTPException
from app.core.config import settings
from pypdf import PdfReader

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
UPLOAD_DIR = "storage"

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

def extract_text_and_chunk_pdf(filepath: str, chunk_size: int = 500, chunk_overlap: int = 50):
    chunks = []
    try:
        reader = PdfReader(filepath)
        for page_nums, page in enumerate(reader.pages, start=1):
            text = page.extract_text()
            if not text:
                continue

            start = 0 
            while start < len(text):
                end = min(start + chunk_size, len(text))
                chunk_text = text[start:end].strip()
                chunks.append({
                    "text": chunk_text,
                    "page": page_nums
                })

                start += (chunk_size - chunk_overlap)

    except Exception as e:
        raise HTTPException(status_code = 500, detail = f"Fail to read PDF file: {str(e)}")
    
    return chunks


def save_loaded_file(db: Session, file: UploadFile, user_id: int):
    file_extension = os.path.splitext(file.filename)[1]
    file_name = str(uuid.uuid4()) + file_extension
    user_dir = f"{UPLOAD_DIR}/{user_id}"
    file_path = os.path.join(user_dir, file_name)
    with open(file_path, "wb") as buffer: #Save file into storage
        copyfileobj(file.file, buffer)

    saved_documents = []
    file_size = os.path.getsize(file_path)
    if file_extension == ".pdf":
        chunks = extract_text_and_chunk_pdf(file_path)
        for chunk in chunks:
            chunk_title = f"{file.filename} - Page {chunk['page']}"
            chunk_size = len(chunk["text"])
            saved_chunk = save_chunks_embeddings(db, ChunkEmbeddingCreate(
                title = chunk_title,
                content = chunk["text"],
                file_path = file_path,
                file_size = chunk_size,
                user_id = user_id
            ))
            saved_documents.append(saved_chunk)
    else:
        saved_chunk = save_chunks_embeddings(db, ChunkEmbeddingCreate(
            title=file.filename,
            content="",
            file_path=file_path,
            file_size=os.path.getsize(file_path),
            user_id=user_id
        ))
        saved_documents.append(saved_chunk)
    return saved_documents

def get_user_document(db: Session, user_id: int) -> list[Document]:
    return db.query(Document).filter(Document.user_id == user_id).all()