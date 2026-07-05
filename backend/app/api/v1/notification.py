from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.notification_mannager import notification_manager
from app.models import User, Notification
import asyncio
import json

router = APIRouter()
# Use Server-Sent Events (SSE) to stream notifications to the client in real-time. The client can listen to this endpoint and receive notifications as they are sent.
@router.get("/stream")
async def stream_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    async def event_generator():
        # 1 Take all the notifications for the current user to send them to the client
        history_notification = db.query(Notification).filter(
            Notification.user_id == current_user.id
        ).order_by(Notification.created_at.desc()).limit(50).all()

        init_data = [
            {
                "id": notif.id,
                "text": notif.text,
                "type": notif.type,
                "created_at": notif.created_at.isoformat(),
            }
            for notif in history_notification
        ]
        yield f"data: {json.dumps(init_data)}\n\n"

        # 2 Connect to the current user's queue (if it doesn't exist, create it) and get the queue
        queue = await notification_manager.connect(current_user.id)
        try: 
            while True: 
                notfication = await queue.get() # wait for a new notification available in the queue
                yield f"data: {json.dumps(notfication)}\n\n" # send the notification to
        except asyncio.CancelledError:
            await notification_manager.disconnect(current_user.id, queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
            