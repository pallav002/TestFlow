from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "TestFlow"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str
    DATABASE_URL: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # SMTP Email (optional — emails are skipped if not configured)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 465
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_NAME: str = "TestFlow"

    # MsgClub SMS (for OTP)
    MSGCLUB_AUTH_KEY: Optional[str] = None
    MSGCLUB_SENDER_ID: str = "TSFLOW"

    # Gemini AI (for question generation)
    GEMINI_API_KEY: Optional[str] = None

    # Frontend URL (used in emails)
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
