# seed.py
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models import User

from app.services import document_service
from app.schemas.document import ChunkEmbeddingCreate
from app.core.security import hash_password

def seed_user():
    db: Session = SessionLocal()
    
    # 1. Check if there are already users in the database to avoid duplicate seeding
    if db.query(User).first() is not None:
        print("There are already users in the database. Skipping seeding.")
        db.close()
        return

    print("Initializing sample data...")

    # 2. Create sample users
    password = ["123abc45", "04567890", "123456789"]
    hashed_pass = [hash_password(p) for p in password]
    users = [
        User(id = 1, username="admin", email="admin@rag.io", password=password[0], is_active=0, hashed_password=hashed_pass[0]),
        User(id = 2, username="developer_bk", email="dev_bk@gmail.com", password=password[1], is_active=0, hashed_password=hashed_pass[1]),
        User(id = 3, username="test_user", email="test@gmail.com", password=password[2], is_active=0, hashed_password=hashed_pass[2]),
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