"""
Configuration management using Pydantic Settings
"""
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, Field


class Settings(BaseSettings):
    """Application settings"""

    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    PORT: int = Field(default=8006, env="PORT")

    # Database
    DATABASE_URL: PostgresDsn = Field(
        default="postgresql://alot:alot@localhost:5432/alot", env="DATABASE_URL"
    )
    DATABASE_POOL_SIZE: int = Field(default=10, env="DATABASE_POOL_SIZE")

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")

    # JWT Authentication
    JWT_SECRET_KEY: str = Field(..., env="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=15, env="JWT_ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7, env="JWT_REFRESH_TOKEN_EXPIRE_DAYS"
    )

    # Stripe
    STRIPE_SECRET_KEY: str = Field(..., env="STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY: str = Field(..., env="STRIPE_PUBLISHABLE_KEY")
    STRIPE_WEBHOOK_SECRET: str = Field(..., env="STRIPE_WEBHOOK_SECRET")

    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3004", "http://127.0.0.1:3004"],
        env="CORS_ORIGINS",
    )

    # AWS (Optional)
    AWS_ACCESS_KEY_ID: Optional[str] = Field(default=None, env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(
        default=None, env="AWS_SECRET_ACCESS_KEY"
    )
    AWS_REGION: str = Field(default="us-east-1", env="AWS_REGION")
    S3_BUCKET_NAME: Optional[str] = Field(default=None, env="S3_BUCKET_NAME")

    # Sentry (Optional)
    SENTRY_DSN: Optional[str] = Field(default=None, env="SENTRY_DSN")

    # Email (Optional - for future notifications)
    SMTP_HOST: Optional[str] = Field(default=None, env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USERNAME: Optional[str] = Field(default=None, env="SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    SMTP_FROM_EMAIL: str = Field(
        default="noreply@alot.com", env="SMTP_FROM_EMAIL"
    )

    # Celery
    CELERY_BROKER_URL: str = Field(
        default="redis://localhost:6379/1", env="CELERY_BROKER_URL"
    )
    CELERY_RESULT_BACKEND: str = Field(
        default="redis://localhost:6379/2", env="CELERY_RESULT_BACKEND"
    )

    # Business Logic
    DEFAULT_FUNDING_MULTIPLIER: float = Field(
        default=2.5, env="DEFAULT_FUNDING_MULTIPLIER"
    )
    EXPIRED_LOT_REFUND_PERCENTAGE: float = Field(
        default=0.98, env="EXPIRED_LOT_REFUND_PERCENTAGE"
    )
    EXPIRED_LOT_CREDIT_MULTIPLIER: float = Field(
        default=1.5, env="EXPIRED_LOT_CREDIT_MULTIPLIER"
    )
    TRIVIA_MAX_ATTEMPTS: int = Field(default=3, env="TRIVIA_MAX_ATTEMPTS")
    TRIVIA_COOLDOWN_MINUTES: int = Field(default=60, env="TRIVIA_COOLDOWN_MINUTES")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
