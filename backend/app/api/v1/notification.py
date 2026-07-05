from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.notification_mannager import notification_manager
from app.models import User
import asyncio
import json

router = APIRouter()
# Use Server-Sent Events (SSE) to stream notifications to the client in real-time. The client can listen to this endpoint and receive notifications as they are sent.
@router.get("/stream")
async def stream_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    async def event_generator():
        queue = await notification_manager.connect(current_user.id)
        try: 
            while True: 
                notfication = await queue.get() # wait for a new notification available in the queue
                yield f"data: {json.dumps(notfication)}\n\n" # send the notification to
        except asyncio.CancelledError:
            await notification_manager.disconnect(current_user.id, queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
            