from app.core.database import SessionLocal
from datetime import datetime, timedelta, timezone
from app.models import Document, ChatSession
from fastapi import BackgroundTasks
import os

def auto_purge_expire_trash():
    db = SessionLocal()
    try:
        expiration_time = datetime.now(timezone.utc) - timedelta(days=1)  # Adjust the expiration time as needed
        expired_documents = db.query(Document).filter(Document.deleted_at <= expiration_time).all()
        for doc in expired_documents:
            if doc.file_path and os.path.exists(doc.file_path):
                try: 
                    os.remove(doc.file_path)
                except Exception as e:
                    print(f"Error deleting file: {e}")
            
            db.delete(doc)

        expired_sessions = db.query(ChatSession).filter(ChatSession.deleted_at <= expiration_time).all()
        for session in expired_sessions:
            db.delete(session)

        db.commit()
        print(f"Auto purge {len(expired_documents)} expired documents and {len(expired_sessions)} expired sessions successfully.")
    except Exception as e:
        print(f"Error during auto purge: {str(e)}")

    db.close()
