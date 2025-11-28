"""
Async database connection setup for SludgeSim.
Supports both SQLite (development) and PostgreSQL (production).
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool, AsyncAdaptedQueuePool

from app.config import settings


class Base(DeclarativeBase):
    """Base class for SQLAlchemy declarative models."""
    pass


def get_engine_args():
    """Get engine arguments based on database type."""
    db_url = settings.get_database_url()

    if db_url.startswith("sqlite"):
        # SQLite: use NullPool for async compatibility
        return {
            "poolclass": NullPool,
            "connect_args": {"check_same_thread": False},
        }
    else:
        # PostgreSQL: use connection pool
        return {
            "poolclass": AsyncAdaptedQueuePool,
            "pool_size": 5,
            "max_overflow": 10,
            "pool_pre_ping": True,
        }


# Create async engine
engine = create_async_engine(
    settings.get_database_url(),
    echo=settings.debug,
    **get_engine_args(),
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        # Import models to ensure they're registered
        from app.db import models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections."""
    await engine.dispose()
