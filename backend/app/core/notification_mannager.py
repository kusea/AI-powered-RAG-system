import asyncio
from typing import Dict, Set

class NotificationManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[asyncio.Queue]] = {} # user_id -> set of queues

    async def connect(self, user_id: int): # connect a user and create a queue for them
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()

        queue = asyncio.Queue()
        self.active_connections[user_id].add(queue)
        return queue
    
    async def disconnect(self, user_id: int, queue: asyncio.Queue): # disconnect a user and remove their queue
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(queue)
            if not self.active_connections[user_id]: # if no more queues for this user, remove the user
                del self.active_connections[user_id]

    async def send_notification(self, user_id: int, message: dict): # send a notification to all queues of a user
        if user_id in self.active_connections:
            for queue in self.active_connections[user_id]:
                await queue.put(message)

notification_manager = NotificationManager()
        
