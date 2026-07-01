# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler

from app.models import Document, User, UserAccount
from app.schemas import document
from app.core.database import Base, engine
from backend.app.init import auto_purge_expire_chat

from app.middlewares.rate_limiter import RateLimitMiddleware

from app.api.v1 import chat, documents, auth, profile, notification

__all__ = ["app", "Base", "Document", "User", "UserAccount"]



@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing the database...")

    try:
        Base.metadata.create_all(bind = engine) # Create tables based on models
        scheduler = BackgroundScheduler()
        scheduler.add_job(auto_purge_expire_chat, "cron", hour = 0, minute = 0, second = 0)
        scheduler.start()
        print("Database initialized successfully.")
        
    except Exception as e:
        print(f"Error during database initialization: {e}")
    
    yield # Application runs after this point
    scheduler.shutdown() #Shut down the scheduler safely to avoid the leak

app = FastAPI(title = "SaaS RAG System", version = "1.0.0", lifespan = lifespan)

origin_fe = ["http://localhost:3000"]

app.add_middleware(RateLimitMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins = origin_fe,
    allow_methods = ["*"],
    allow_headers = ["*"],
    allow_credentials = True
)

# Declare API routes
app.include_router(chat.router, prefix = "/api/v1/chat", tags = ["AI Chat and Vector Search"])
app.include_router(documents.router, prefix = "/api/v1/documents", tags = ["Documents and Embeddings"])
app.include_router(auth.router, prefix = "/api/v1/auth", tags = ["Authentication"])
app.include_router(profile.router, prefix = "/api/v1/profile", tags = ["Profile"])
app.include_router(notification.router, prefix = "/api/v1/notification", tags = ["Notification"])

@app.get("/", tags = ["Health Check"])
def read_root():
    return {"status": "healthy", "message": "Welcome to API router" }

# Event handler when the application starts: initialize pgvector extension and create tables


