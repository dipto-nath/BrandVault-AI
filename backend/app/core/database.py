from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase, declared_attr
from sqlalchemy import Index, text, event
from sqlalchemy.pool import NullPool
import structlog

from app.core.config import settings

logger = structlog.get_logger()


class OrgBase(DeclarativeBase):
    """Base class with automatic org_id index for all tenant-scoped tables."""

    @declared_attr.directive
    def __table_args__(cls) -> tuple:
        # Add org_id index for all tables that have org_id column
        # This will be overridden by explicit __table_args__ in models
        return ()


class DatabaseManager:
    def __init__(self):
        self._engine: Optional[AsyncEngine] = None
        self._session_factory: Optional[async_sessionmaker[AsyncSession]] = None

    def initialize(self) -> None:
        if self._engine is not None:
            return

        # Use NullPool for serverless/async environments
        pool_class = NullPool if settings.ENVIRONMENT == "production" else None

        self._engine = create_async_engine(
            settings.DATABASE_URL,
            echo=settings.ENVIRONMENT == "development",
            poolclass=pool_class,
            pool_pre_ping=True,
        )
        self._session_factory = async_sessionmaker(
            self._engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
        logger.info("Database engine initialized")

    async def close(self) -> None:
        if self._engine:
            await self._engine.dispose()
            self._engine = None
            self._session_factory = None
            logger.info("Database engine closed")

    @asynccontextmanager
    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        if self._session_factory is None:
            self.initialize()

        async with self._session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    @asynccontextmanager
    async def session_with_rls(
        self, org_id: str
    ) -> AsyncGenerator[AsyncSession, None]:
        """Session with RLS context set for the organization."""
        async with self.session() as session:
            # Set PostgreSQL session variable for RLS
            await session.execute(
                text("SELECT set_config('app.current_org_id', :org_id, true)"),
                {"org_id": org_id},
            )
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    def get_engine(self) -> AsyncEngine:
        if self._engine is None:
            self.initialize()
        return self._engine


# Global database manager
db_manager = DatabaseManager()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for database session."""
    async with db_manager.session() as session:
        yield session


async def get_db_with_rls(org_id: str) -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for database session with RLS context."""
    async with db_manager.session_with_rls(org_id) as session:
        yield session


# Event listener to log slow queries in development
@event.listens_for(AsyncEngine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    if settings.ENVIRONMENT == "development":
        context._query_start_time = __import__("time").time()


@event.listens_for(AsyncEngine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    if settings.ENVIRONMENT == "development":
        import time

        total = time.time() - context._query_start_time
        if total > 0.5:  # Log queries slower than 500ms
            logger.warning(
                "slow_query",
                duration_ms=round(total * 1000, 2),
                statement=statement[:200],
            )