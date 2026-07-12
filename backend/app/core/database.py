# database.py
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Make connecting engine to PostgreSQL database using the URL from settings
engine = create_engine(
    settings.DATABASE_URL, 
    echo=True,
    pool_size = 30, # Number of connections to the database
    max_overflow = 10, # Maximum number of connections that can be added beyond the pool_size
    pool_timeout = 60, # Maximum number of seconds to wait for a connection
    pool_recycle = 1800 # Automatically refresh every 30 minutes (1800 seconds)
)

# Make session class to exchange when call API
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine,expire_on_commit=False)

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