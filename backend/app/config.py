"""
Configuration settings for SludgeSim backend.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


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


settings = Settings()
