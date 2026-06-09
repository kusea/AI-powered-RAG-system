#Dỉrectly work with SQLAlchemy to store and query vector
from sqlalchemy.orm import Session
from app.models.document import Document
from app.schemas.document import ChunkEmbeddingCreate

def save_chunks_embeddings(db: Session, item: ChunkEmbeddingCreate):
    db_item = Document(
        title=item.title,
        content=item.content,
        embedding=item.embedding,
        user_id=item.user_id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
