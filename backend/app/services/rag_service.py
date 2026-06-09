from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.document import Document
from typing import List

#Logic to search for similar embeddings based on cosine similarity using pgvector's built-in functions
def search_similar_embeddings(db: Session, target_vector: List[float], limit: int) -> List[Document]:
    if len(target_vector) != 3:
        raise HTTPException(status_code=400, detail="Vector must have exactly 3 dimensions.")
    
    results = db.query(Document).order_by(
        Document.embedding.cosine_distance(target_vector)
    ).limit(limit).all()
    return results