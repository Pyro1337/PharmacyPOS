from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "PharmacyPOS Paraguay"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    SECRET_KEY: str = "change-me-in-production-super-secret-key-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = "postgresql://pharmacy:pharmacy123@db:5432/pharmacypos"
    # For local dev without docker
    DATABASE_URL_SYNC: str = "postgresql://pharmacy:pharmacy123@localhost:5432/pharmacypos"

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:80"]

    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_BUCKET: str = "pharmacy-pdfs"
    MINIO_SECURE: bool = False

    FARMACIA_NOMBRE: str = "Farmacia Central Paraguay"
    MONEDA: str = "PYG"
    TIMEZONE: str = "America/Asuncion"

    BCRYPT_ROUNDS: int = 12

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()

def validate_settings():
    if os.getenv("ENVIRONMENT") == "production":
        defaults = ["change-me", "secret", "password123"]
        for d in defaults:
            if d in settings.SECRET_KEY.lower():
                raise ValueError("SECRET_KEY is using default placeholder in production!")

