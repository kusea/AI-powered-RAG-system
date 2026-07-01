#Dỉrectly work with SQLAlchemy to store and query vector
from sqlalchemy.orm import Session
from app.models import Document, ChunkDocument, User, DocumentShare
from app.schemas.document import ChunkEmbeddingCreate, DocumentShareCreate
from sentence_transformers import SentenceTransformer

import os 
import uuid
import pandas as pd
from datetime import datetime, timezone
from shutil import copyfileobj
from fastapi import UploadFile, HTTPException
from app.core.config import settings
from pypdf import PdfReader
from docx import Document as DocxReader 
from pptx import Presentation
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter


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

        elif file_extension == "md":
            with open(filepath, "r", encoding="utf-8") as f:
                text = f.read()

            headers_to_split = [
                ('#', 'Header1'),
                ('##', 'Header2'),
                ('###', 'Header3'),
            ]

            # Intialize the splitter with the headers
            markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split=headers_to_split)
            md_header_splitter = markdown_splitter.split_text(text)

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size = chunk_size,
                chunk_overlap = chunk_overlap,
                seperators = ["\n\n", "\n", " ", ""]
            )

            splits = text_splitter.split_documents(md_header_splitter) # Split the text with headers and content (include page_content and metadata)
            for idx, split in enumerate(splits, start=1):
                chunk_text = split.page_content.strip()

                if not chunk_text:
                    continue
                
                # Create header and context from metadata and split to each other by " > "
                header_content = " > ".join([f"{header}: {content}" for header, content in split.metadata.items()])
                full_chunk_text = chunk_text
                if header_content:
                    full_chunk_text = f"[{header_content}]\n{chunk_text}" #Make content with full context and headers

                chunks.append({
                    "text": full_chunk_text,
                    "source_location": f"{filepath}:chunk:{idx}"
                })

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
                row_dict = row.to_dict()
                row_text = ", ".join([f"{col}: {val}" for col, val in row_dict.items() if pd.notna(val)])
                if row_text:
                    chunks.append({
                        "text": row_text,
                        "row": idx + 1
                    })
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f"Fail to read PDF file: {str(e)}")
    
    return chunks


def extract_full_text(filepath: str):
    file_extension = filepath.split(".")[-1].lower()
    full_text = ""
    try:
        if file_extension == "pdf": 
            reader = PdfReader(filepath)
            text_list = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_list.append(text)
            full_text = "\n".join(text_list)
        elif file_extension ==  "docx":
            doc = DocxReader(filepath)
            full_text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        elif file_extension in ["html", "txt", "md"]:
            with open(filepath, "r", encoding = "utf-8") as f: 
                full_text = f.read()
        elif file_extension == "pptx":
            prs = Presentation(filepath)
            for slide in prs.slides:
                slide_text = []
                for shape in slide.shapes:
                    slide_text.append(shape.text) if hasattr(shape, "text") and shape.text.strip() else None
                full_text += "\n".join(slide_text)
        elif file_extension in ["csv", "xls", "xlsx"]:
            df = pd.read_csv(filepath) if file_extension == "csv" else pd.read_excel(filepath)
            
            row_list = []
            for idx, row in df.iterrows():
                row_dict = row.to_dict()
                row_text = ", ".join([f"{col}: {val}" for col, val in row_dict.items() if pd.notna(val)])
                row_list.append(row_text) if row_text else None
            full_text = "\n".join(row_list)
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f"Fail to read file: {str(e)}")
    
    return full_text.strip()

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
    
    file_content = extract_full_text(file_path)
    
    saved_documents = save_chunks_embeddings(db, ChunkEmbeddingCreate(
        title=file.filename, 
        content=file_content,
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
    return db.query(Document).filter(Document.user_id == user_id, Document.deleted_at == None).all()

def delete_document(db: Session, document_ids: list[int], user_id: int):
    docs = db.query(Document).filter(Document.id.in_(document_ids), Document.user_id == user_id, Document.deleted_at == None)
    if not docs:
        raise HTTPException(status_code=404, detail="Document not found in your account's storage.")
    
    docs.update({"deleted_at": datetime.now(timezone.utc)}, synchronize_session = False)
    db.commit()
    return {"message": "Move document to trash successfully!!!"}

def restore_document(db: Session, document_ids: list[int], user_id: int):
    docs = db.query(Document).filter(Document.id.in_(document_ids), Document.user_id == user_id, Document.deleted_at != None)
    if not docs:
        raise HTTPException(status_code=404, detail="Document not found in your account's trash.")
    
    docs.update({"deleted_at": None}, synchronize_session = False)
    db.commit()
    return {"message": "Restore document successfully!!!"}

def shared_document_to_user(shared_data: DocumentShareCreate, db: Session, user_id: int):
    doc = db.query(Document).filter(
        Document.id == shared_data.document_id,
        Document.user_id == user_id,
        Document.deleted_at == None
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found in your account's storage.")
    
    receiver = db.query(User).filter(User.email == shared_data.shared_to_email).first()

    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found.")
    
    if receiver.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot share document to yourself.")
    
    existing_share = db.query(DocumentShare).filter(
        DocumentShare.document_id == shared_data.document_id,
        DocumentShare.shared_to_id == receiver.id,
        DocumentShare.shared_by_id == user_id
    ).first()

    if existing_share:
        existing_share.permission = shared_data.permission
        db.commit()
        db.refresh(existing_share)
        return existing_share
    
    new_share = DocumentShare(
        shared_by_id = user_id,
        shared_to_id = receiver.id,
        document_id = shared_data.document_id,
        permission = shared_data.permission
    )
    doc.shares.append(new_share)
    db.add(new_share)
    db.commit()
    db.refresh(new_share)
    return new_share

def get_shared_document(db: Session, user_id: int):
    return db.query(Document).join(DocumentShare, Document.id == DocumentShare.document_id).filter(
        DocumentShare.shared_to_id == user_id,
        Document.deleted_at == None
    ).all()
    