import redis
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.config import settings

redis_client = redis.Redis(
    host=settings.REDIS_HOST, 
    port=settings.REDIS_PORT, 
    decode_responses=True,
    socket_connect_timeout = 0.1, # Maximum time to connect
    socket_timeout = 0.1          # Maximum time to read/write data
)
api_folder = "/api/v1/"
api_doc = api_folder + "documents"
api_chat = api_folder + "chat"
class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        print(f"Middleware path: {path}")

        if path.startswith(api_doc) or path.startswith(api_chat):
            client_id = request.client.host
            redis_key = f"rate_limit:{client_id}:{path}"

            try:
                current_requests = redis_client.get(redis_key)
                if current_requests and int(current_requests) >= settings.RATE_LIMIT_REQUESTS:
                    return JSONResponse(content={"status": "error","message": "Rate limit exceeded"}, status_code=429)
                
                # Increment the rate limit counter.
                pipe = redis_client.pipeline()
                pipe.incr(redis_key)

                if not current_requests:
                    pipe.expire(redis_key, settings.RATE_LIMIT_TIME_WINDOW)

                pipe.execute()

            except redis.RedisError as e:
                print(f"Redis error: {e}")

        response = await call_next(request)
        return response