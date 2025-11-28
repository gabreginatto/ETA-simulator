"""
Configuration settings for SludgeSim backend.
"""
import logging
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Settings
    app_name: str = "SludgeSim API"
    debug: bool = True

    # Database
    database_url: str = "sqlite+aiosqlite:///./sludgesim.db"

    # Cloud SQL settings (for GCP deployment)
    cloud_sql_connection_name: Optional[str] = None
    db_user: str = "postgres"
    db_pass: str = "postgres"
    db_name: str = "sludgesim"
    db_host: str = "localhost"
    db_port: int = 5432
    use_cloud_sql_proxy: bool = False

    # CORS
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # Logging
    log_level: str = "INFO"

    # GCP Configuration
    gcp_project_id: str = ""
    gcp_project_number: str = ""

    # Feature flags
    enable_recycles: bool = False  # Enable recycle loop support in solver

    # Auth settings (stub for now)
    auth_enabled: bool = False
    auth_token: Optional[str] = None  # Static token for stub auth

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def get_database_url(self) -> str:
        """Get the appropriate database URL based on configuration."""
        if self.use_cloud_sql_proxy and self.cloud_sql_connection_name:
            # Cloud SQL via Unix socket
            return f"postgresql+asyncpg://{self.db_user}:{self.db_pass}@/{self.db_name}?host=/cloudsql/{self.cloud_sql_connection_name}"
        elif self.database_url.startswith("postgresql"):
            return self.database_url
        else:
            # Default to configured URL (SQLite for local dev)
            return self.database_url

    def validate_and_log_database(self) -> None:
        """Validate database configuration and log which database is in use."""
        url = self.get_database_url()
        if not url:
            raise ValueError("DATABASE_URL is required but not configured")

        # Log sanitized URL (hide password)
        if "@" in url:
            # Format: driver://user:pass@host/db - hide the password
            parts = url.split("@")
            prefix_parts = parts[0].split(":")
            if len(prefix_parts) >= 3:
                # Hide password
                sanitized = f"{prefix_parts[0]}:{prefix_parts[1]}:***@{parts[1]}"
            else:
                sanitized = f"{parts[0]}@{parts[1]}"
            logger.info(f"Database configured: {sanitized}")
        else:
            logger.info(f"Database configured: {url}")

        # Log database type
        if url.startswith("sqlite"):
            logger.info("Using SQLite database (development mode)")
        elif url.startswith("postgresql"):
            logger.info("Using PostgreSQL database (production mode)")


settings = Settings()
