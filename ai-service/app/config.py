"""
Configuration
--------------
Loads environment variables (via python-dotenv) and exposes typed
settings used throughout the AI service. No secrets or URLs are
hardcoded anywhere else in the codebase — everything flows through here.
"""

import os
from dotenv import load_dotenv

load_dotenv()  # reads .env if present; falls back to real env vars otherwise


class Settings:
    HOST: str = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("AI_SERVICE_PORT", "8001"))

    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS", "http://localhost:5000,http://localhost:5173"
        ).split(",")
        if origin.strip()
    ]

    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")


settings = Settings()