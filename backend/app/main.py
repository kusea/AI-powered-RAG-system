# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.models.document import Document
from app.schemas import document
from app.core.database import Base, engine
from app.models.user import User

from app.api.v1 import chat, documents

__all__ = ["app", "Base", "Document", "User"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing the database...")

    try:
        Base.metadata.create_all(bind = engine) # Create tables based on models
        print("Database initialized successfully.")

        
    except Exception as e:
        print(f"Error during database initialization: {e}")
    
    yield # Application runs after this point

app = FastAPI(title = "SaaS RAG System", version = "1.0.0", lifespan = lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_methods = ["*"],
    allow_headers = ["*"],
    allow_credentials = True
)

# Declare API routes
app.include_router(chat.router, prefix = "/api/v1/chat", tags = ["AI Chat and Vector Search"])
app.include_router(documents.router, prefix = "/api/v1/documents", tags = ["Documents and Embeddings"])

@app.get("/", tags = ["Health Check"])
def read_root():
    return {"status": "healthy", "message": "Welcome to API router" }

# Event handler when the application starts: initialize pgvector extension and create tables


