#Dỉrectly work with SQLAlchemy to store and query vector
from sqlalchemy.orm import Session
from app.models.document import Document
from app.schemas.document import ChunkEmbeddingCreate
from sentence_transformers import SentenceTransformer

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
