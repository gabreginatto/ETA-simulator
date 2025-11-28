"""
Shared test fixtures for SludgeSim backend tests.
Provides transactional isolation for database tests.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.seed_data import seed_database


@pytest.fixture(scope="session")
def anyio_backend():
    """Required for pytest-asyncio with anyio."""
    return "asyncio"


# Global engine for shared in-memory database
_test_engine = None
_test_session_factory = None


@pytest.fixture(scope="session")
async def test_engine():
    """Create a test database engine (session-scoped)."""
    global _test_engine, _test_session_factory

    # Use in-memory SQLite with StaticPool to share connection
    test_db_url = "sqlite+aiosqlite:///:memory:"

    _test_engine = create_async_engine(
        test_db_url,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )

    _test_session_factory = async_sessionmaker(
        _test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    # Import models to register them with Base
    from app.db import models  # noqa: F401

    # Create all tables
    async with _test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed the database
    async with _test_session_factory() as session:
        await seed_database(session)
        await session.commit()

    yield _test_engine

    await _test_engine.dispose()


@pytest.fixture
async def db_session(test_engine):
    """
    Function-scoped database session with transactional isolation.
    Each test gets a fresh transaction that is rolled back after the test.
    """
    async with _test_engine.connect() as conn:
        # Start a transaction
        trans = await conn.begin()

        # Create a session bound to this connection
        session = AsyncSession(bind=conn, expire_on_commit=False)

        try:
            yield session
        finally:
            # Rollback the transaction (undo any test changes)
            await trans.rollback()
            await session.close()


@pytest.fixture
async def client(test_engine, db_session):
    """
    Async test client with overridden database dependency.
    Uses the transactional db_session for isolation.
    """
    # Override the get_db dependency to use our test session
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    # Clean up the override
    app.dependency_overrides.clear()
