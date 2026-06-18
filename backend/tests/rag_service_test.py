import os
import sys
import requests

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models import User, Document
from app.core.database import SessionLocal
from app.services.document_service import extract_text_and_chunk_pdf, save_chunks_embeddings
from app.services.rag_service import search_similar_embeddings
from app.schemas.document import ChunkEmbeddingCreate

SAMPLE_PDF = 'storage/5f9b402e-4e8d-46cc-ba84-af03fd123294.pdf'
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
USER_ID = 2
QUERY = "Search algorithm"
SEARCH_LIMIT = 2

def test_rag_process():
    db = SessionLocal()
    # 1. Define the sampl document
    # Create storage folder if it does not exist
    if not os.path.exists("storage"):
        os.makedirs("storage")
        
    if not os.path.exists(SAMPLE_PDF):
        print(f"Can't not find {SAMPLE_PDF}. Please check the path.")
        db.close()
        return

    print(f"Begin to process {SAMPLE_PDF}...")
    
    # 2. Start chunking
    chunks = extract_text_and_chunk_pdf(SAMPLE_PDF, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
    print(f"Divided the document into {len(chunks)} chunks.")

    # 3. Embedding & Lưu vào Database
    print("Create vector embeddings and save to database...")
    stored_count = 0
    for chunk in chunks:
        chunk_title = f"Test_Doc.pdf (Page {chunk['page']})"
        chunk_data = ChunkEmbeddingCreate(
            title=chunk_title,
            content=chunk['text'],
            file_path=SAMPLE_PDF,
            file_size=os.path.getsize(SAMPLE_PDF),
            user_id=USER_ID
        )
        save_chunks_embeddings(db, chunk_data)
        stored_count += 1
        
    print(f"Successfully stored {stored_count} chunks to database.")

    # 4. Thử nghiệm truy vấn lấy tài liệu liên quan dựa trên Cosine Similarity
    print("\n" + "="*50)
    print("TESTING: CONTEXT SEARCH (RAG SEARCH)")
    print("="*50)
    
    # Gọi hàm search từ rag_service để kiểm tra pgvector hoạt động đúng không
    search_results = search_similar_embeddings(db=db, query_text=QUERY, limit=SEARCH_LIMIT)
    
    print(f"\n[+] The most similar results to the query (Top 2):")
    for idx, doc in enumerate(search_results, start=1):
        print(f"\n--- Result #{idx} (The most similar) ---")
        print(f"Origin: {doc.title}")
        print(f"Paragraph content: {doc.content}")
        print(f"Testing vector's dimension: {len(doc.embedding)} dimensions")


if __name__ == "__main__":
    test_rag_process()