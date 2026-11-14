from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://brandvault:brandvault@localhost:5432/brandvault"
    )

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    # Auth
    JWT_SECRET: str = Field(default="dev-secret-change-in-production-min-32-chars")
    JWT_ALGORITHM: str = Field(default="HS256")
    JWT_EXPIRE_MINUTES: int = Field(default=60)

    # AI
    GEMINI_API_KEY: str = Field(default="")
    GEMINI_MODEL: str = Field(default="gemini-1.5-flash")
    EMBEDDING_MODEL: str = Field(default="text-embedding-3-small")
    EMBEDDING_DIMENSIONS: int = Field(default=1536)
    USE_MOCK_LLM: bool = Field(default=True)

    # Storage
    STORAGE_TYPE: str = Field(default="local")
    STORAGE_PATH: str = Field(default="/app/uploads")

    # App
    ENVIRONMENT: str = Field(default="development")
    LOG_LEVEL: str = Field(default="INFO")
    CORS_ORIGINS: List[str] = Field(default=["http://localhost:3000"])

    # Demo
    DEMO_WORKSPACE_SLUG: str = Field(default="nexatech")
    DEMO_USER_ID: str = Field(default="22222222-2222-2222-2222-222222222222")

    # Celery
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/0")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()