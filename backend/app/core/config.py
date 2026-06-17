# config.py
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    USERNAME: str = os.getenv("DB_USER")
    DB_NAME: str = os.getenv("DB_NAME")
    PASSWORD: str = os.getenv("DB_PASSWORD")
    HOST: str = os.getenv("DB_HOST")
    PORT: str = os.getenv("DB_PORT")
    DATABASE_URL: str = f"postgresql://{USERNAME}:{PASSWORD}@{HOST}:{PORT}/{DB_NAME}"

    VECTOR_DIMENSION: int = os.getenv("DIMENSION")

    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID")

    REDIS_HOST: str = os.getenv("REDIS_HOST")
    REDIS_PORT: str = int(os.getenv("REDIS_PORT"))
    RATE_LIMIT_REQUESTS: int = 10
    RATE_LIMIT_TIME_WINDOW: int = 60

    class Config:
        env_file = ".env"
        extra = "ignore" # Ignore extra fields in the .env file that are not defined in this Settings class

settings = Settings()