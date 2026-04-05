from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    allowed_root: str = "/music"
    cors_origins: list[str] = ["http://localhost:5173"]
    musicbrainz_user_agent: str = "MP3TagEditor/1.0 (admin@example.com)"
    musicbrainz_rate_limit_seconds: float = 1.1
    default_backup_suffix: str = ".bak"
    max_scan_depth: int = 5
    max_scan_files: int = 5000

    class Config:
        env_file = ".env"


settings = Settings()
