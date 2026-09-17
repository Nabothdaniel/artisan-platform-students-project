import os


def _parse_cors_origins(raw: str | None) -> list[str]:
    default_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*",
    ]

    if not raw:
        return default_origins

    values = [part.strip() for part in raw.split(",") if part.strip()]
    return values or default_origins

class Settings:
    PROJECT_NAME: str = "ArtisanHub API"
    PROJECT_VERSION: str = "1.0.0"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "artisan_hub_secret_key_super_secure_2026_keffi")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Allows setting DATABASE_URL environment variable for PostgreSQL or SQLite default
    _raw_db_url: str = os.getenv("DATABASE_URL", "sqlite:///./artisan_hub.db")
    
    @property
    def DATABASE_URL(self) -> str:
        url = self._raw_db_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    CORS_ORIGINS: list[str] = _parse_cors_origins(os.getenv("CORS_ORIGINS"))

settings = Settings()
