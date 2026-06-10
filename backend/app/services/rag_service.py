from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.document import Document
from app.core.config import settings
from sentence_transformers import SentenceTransformer
from typing import List

#Logic to search for similar embeddings based on cosine similarity using pgvector's built-in functions
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
def search_similar_embeddings(db: Session, query_text: str, limit: int) -> List[Document]:
    query_vector = embedding_model.encode(query_text).tolist()
    if len(query_vector) != settings.VECTOR_DIMENSION:
        raise HTTPException(status_code=400, detail="Vector must have exactly the number of dimensions.")
    
    results = db.query(Document).order_by(
        Document.embedding.cosine_distance(query_vector)
    ).limit(limit).all()
    return results