import asyncio
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from uuid import UUID

from app.core.config import settings
from app.models.base import Base
from app.models import organization, source, fact, guideline, content, analysis, finding, review, suggestion, audit, passport


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    await engine.dispose()


@pytest_asyncio.fixture
async def test_db(test_engine):
    """Create a test database session."""
    async_session = sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def demo_org(test_db):
    """Create a demo organization for testing."""
    from app.models.organization import Organization
    
    org = Organization(
        id=UUID("11111111-1111-1111-1111-111111111111"),
        name="Test Org",
        slug="test-org",
        description="Test organization",
    )
    test_db.add(org)
    await test_db.commit()
    await test_db.refresh(org)
    return org


@pytest_asyncio.fixture
async def demo_user(test_db, demo_org):
    """Create a demo user for testing."""
    from app.models.organization import User
    from app.core.security import get_password_hash
    
    user = User(
        id=UUID("22222222-2222-2222-2222-222222222222"),
        org_id=demo_org.id,
        email="test@example.com",
        full_name="Test User",
        hashed_password=get_password_hash("test123"),
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest.fixture
def mock_settings(monkeypatch):
    """Mock settings for testing."""
    monkeypatch.setattr(settings, "USE_MOCK_LLM", True)
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    monkeypatch.setattr(settings, "JWT_SECRET", "test-secret-key-min-32-chars-long")
    monkeypatch.setattr(settings, "DATABASE_URL", "sqlite+aiosqlite:///:memory:")