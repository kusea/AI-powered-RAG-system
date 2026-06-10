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

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()