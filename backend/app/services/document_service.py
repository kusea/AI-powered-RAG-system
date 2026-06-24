#Dỉrectly work with SQLAlchemy to store and query vector
from sqlalchemy.orm import Session
from app.models import Document, ChunkDocument
from app.schemas.document import ChunkEmbeddingCreate
from sentence_transformers import SentenceTransformer

import os 
import uuid
import openpyxl
import pandas as pd
from shutil import copyfileobj
from fastapi import UploadFile, HTTPException
from app.core.config import settings
from pypdf import PdfReader
from docx import Document as DocxReader 
from pptx import Presentation


# Encode content (or title) text to vector embedding
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def save_chunks_embeddings(db: Session, item: ChunkEmbeddingCreate, doc_id:int = None):
    text_encode = item.content if item.content else item.title
    text_embedding = embedding_model.encode(text_encode).tolist() # Convert numpy array to list for JSON serialization
    db_item = Document(
        title=item.title,
        content=item.content,
        user_id=item.user_id,
        file_path=item.file_path,
        file_size=item.file_size
    ) if not doc_id else ChunkDocument(
        content=item.content,
        embedding=text_embedding,
        document_id=doc_id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def extract_text_and_chunk(filepath: str, chunk_size: int = 500, chunk_overlap: int = 50):
    chunks = []
    file_extension = filepath.split(".")[-1].lower()
    try:
        if file_extension == "pdf":
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

        elif file_extension in ["txt", "html"]:
            with open(filepath, "r", encoding="utf-8") as f:
                text = f.read()
            start = 0
            while start < len(text):
                end = min(start + chunk_size, len(text))
                chunk_text = text[start:end].strip()
                chunks.append({
                    "text": chunk_text, 
                    "source_location": f"{filepath}:{start}:{end}"
                }) if chunk_text else None
                start += (chunk_size - chunk_overlap)

        elif file_extension == "docx":
            doc = DocxReader(filepath)
            full_text = "\n".join([paragraph.text for paragraph in doc.paragraphs])

            start = 0
            while start < len(full_text):
                end = min(start + chunk_size, len(full_text))
                chunk_text = full_text[start:end].strip()
                chunks.append({
                    "text": chunk_text,
                    "source_location": f"{filepath}:{start}:{end}"
                }) if chunk_text else None
                start += (chunk_size - chunk_overlap)
        
        elif file_extension == "pptx":
            prs = Presentation(filepath)
            for idx, slide in enumerate(prs.slides, start=1):
                slide_text = []
                for shape in slide.shapes: 
                    slide_text.append(shape.text) if hasattr(shape, "text") and shape.text.strip() else None
                text = "\n".join(slide_text)
                if text.strip():
                    chunks.append({
                        "text": text.strip(),
                        "slide": idx
                    })
        
        elif file_extension in ["csv", "xls", "xlsx"]:
            df = pd.read_csv(filepath) if file_extension == "csv" else pd.read_excel(filepath)
            for idx, row in df.iterrows():
                row_text = ", ".join([f"{col}: {val}" for col, val in row.items() if pd.notna(val)])
                if row_text:
                    chunks.append({
                        "text": row_text,
                        "row": idx + 1
                    })
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f"Fail to read PDF file: {str(e)}")
    
    return chunks

# Upload file
UPLOAD_DIR = "storage"

def save_loaded_file(db: Session, file: UploadFile, user_id: int, background_tasks):
    user_dir = os.path.join(UPLOAD_DIR, str(user_id))
    os.makedirs(user_dir, exist_ok = True)

    file_extension = os.path.splitext(file.filename)[1]
    file_name = str(uuid.uuid4()) + file_extension
    
    file_path = os.path.join(user_dir, file_name)
    with open(file_path, "wb") as buffer: #Save file into storage
        copyfileobj(file.file, buffer)

    document = db.query(Document).filter(Document.title == file.filename and Document.user_id == user_id).first()
    if document:
        raise HTTPException(status_code=400, detail="Document with the same name already exists.")
    
    saved_documents = save_chunks_embeddings(db, ChunkEmbeddingCreate(
        title=file.filename, 
        content="",
        user_id=user_id, 
        file_path=file_path, 
        file_size=os.path.getsize(file_path)
    ))

    document_id = saved_documents.id
    from app.core.database import SessionLocal

    background_tasks.add_task(process_chunks_task, SessionLocal, document_id, file_path)

    return saved_documents

def process_chunks_task(db_factory, document_id: int, file_path: str): # Run in background
    db: Session = db_factory()
    try:
        chunks = extract_text_and_chunk(file_path)
        for chunk in chunks:
            if not chunk['text'].strip():
                continue
            """ 
            if "page" in chunk: # PDF
                chunk_title = f"{file.filename} (Page {chunk['page']})"
            elif "slide" in chunk: # PPTX
                chunk_title = f"{file.filename} (Slide {chunk['slide']})"
            elif "row" in chunk: # CSV, XLS, XLSX
                chunk_title = f"{file.filename} (Row {chunk['row']})"
            else: # TXT, HTML, DOCX
                chunk_title = f"{file.filename} ({chunk['source_location']})"
            print(f"Chunk title: {chunk_title}") """
            chunk_data = ChunkEmbeddingCreate(
                content=chunk['text'],
                document_id=document_id
            )
            save_chunks_embeddings(db, chunk_data, doc_id=document_id)
            print(f"Background tasks completed for all chunks of document that has id {document_id}")
    except Exception as e:
        print(f"Error during background tasks during processing chunks of document {document_id}: {str(e)}")
    finally:
        db.close()
        

def get_user_document(db: Session, user_id: int) -> list[Document]:
    return db.query(Document).filter(Document.user_id == user_id).all()