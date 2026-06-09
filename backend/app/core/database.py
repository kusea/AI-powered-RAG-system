# database.py
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Make connecting engine to PostgreSQL database using the URL from settings
engine = create_engine(settings.DATABASE_URL, echo=True)

# Make session class to exchange when call API
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class of ORM Models
Base = declarative_base()

# Inject DB sessio into FastAPI route
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to automatically initialize the pgvector extension when the application starts
@event.listens_for(Base.metadata, "before_create")
def init_pgvector_extension(target, connection, **kw):
    print("Initializing pgvector extension through hook event...")
    connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))