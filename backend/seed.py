# seed.py
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.user import User

from app.services import document_service
from app.schemas.document import ChunkEmbeddingCreate

def seed_user():
    db: Session = SessionLocal()
    
    # 1. Check if there are already users in the database to avoid duplicate seeding
    if db.query(User).first() is not None:
        print("There are already users in the database. Skipping seeding.")
        db.close()
        return

    print("Initializing sample data...")

    # 2. Create sample users
    users = [
        User(username="admin", email="admin@rag.io", hashed_password="hashed_password_123", is_active=True),
        User(username="developer_bk", email="dev_bk@gmail.com", hashed_password="hashed_password_456", is_active=True),
        User(username="test_user", email="test@gmail.com", hashed_password="hashed_password_789", is_active=True)
    ]
    db.add_all(users)
    db.commit()

def seed_document():
    
    db: Session = SessionLocal()

    users = db.query(User).all()
    if not users:
        print("No users found in the database. Please seed users first.")
        db.close()
        return

    print("Initializing sample data...")
    # 2. Create sameple documents associated with the created users
    raw_documents = [
        ChunkEmbeddingCreate(
            title="Guiding for Python Beginners",
            content="Python is a powerful, easy-to-learn, and widely popular programming language.",
            file_path="/storage/docs/python_basic.txt",
            file_size=1024,
            user_id=users[1].id,
        ),
        ChunkEmbeddingCreate(
            title="Startup Funding Strategies",
            content="Initial funding requires focusing on product optimization rather than burning marketing money.",
            file_path="/storage/docs/startup_fund.txt",
            file_size=4050,
            user_id=users[0].id,
        ),
        ChunkEmbeddingCreate(
            title="Meditation Techniques for Stress Relief",
            content="Dedicating 10 minutes each morning to focus on your breathing can significantly improve concentration.",
            file_path="/storage/docs/meditation.txt",
            file_size=1500,
            user_id=users[2].id,
        )
    ]

    for doc in raw_documents:
        document_service.save_chunks_embeddings(db, doc)

    db.commit()
    db.close()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed_user()
    seed_document()