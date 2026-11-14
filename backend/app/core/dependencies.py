from typing import Optional, List
from uuid import UUID
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db_manager, get_db
from app.core.security import (
    verify_token,
    UserContext,
    require_role,
    TokenPayload,
)
from app.core.config import settings
import structlog

logger = structlog.get_logger()


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> UserContext:
    """Extract and validate user from JWT token."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
        )

    token = authorization[7:]  # Remove "Bearer "
    payload = verify_token(token)

    return UserContext(
        user_id=UUID(payload.sub),
        org_id=UUID(payload.org_id),
        role=payload.role,
        email=payload.email,
    )


async def get_current_user_demo(
    db: AsyncSession = Depends(get_db),
) -> UserContext:
    """Demo mode user context - no auth required."""
    from uuid import UUID

    return UserContext(
        user_id=UUID(settings.DEMO_USER_ID),
        org_id=UUID("11111111-1111-1111-1111-111111111111"),  # Will be resolved from demo workspace
        role="ADMIN",
        email="demo@nexatech.example",
        full_name="Demo Reviewer",
    )


def get_current_user_flexible(
    authorization: Optional[str] = Header(None),
) -> UserContext:
    """Flexible auth - uses demo if no token, otherwise validates JWT."""
    if not authorization or not authorization.startswith("Bearer "):
        # Return demo user
        from uuid import UUID

        return UserContext(
            user_id=UUID(settings.DEMO_USER_ID),
            org_id=UUID("11111111-1111-1111-1111-111111111111"),
            role="ADMIN",
            email="demo@nexatech.example",
            full_name="Demo Reviewer",
        )

    token = authorization[7:]
    payload = verify_token(token)
    return UserContext(
        user_id=UUID(payload.sub),
        org_id=UUID(payload.org_id),
        role=payload.role,
        email=payload.email,
    )


async def get_db_with_org(
    user: UserContext = Depends(get_current_user_flexible),
) -> AsyncSession:
    """Get database session with RLS context set for user's org."""
    async with db_manager.session_with_rls(str(user.org_id)) as session:
        yield session


def require_admin(user: UserContext = Depends(get_current_user_flexible)) -> UserContext:
    """Require ADMIN role."""
    require_role(user, ["ADMIN"])
    return user


def require_reviewer_or_admin(
    user: UserContext = Depends(get_current_user_flexible),
) -> UserContext:
    """Require REVIEWER or ADMIN role."""
    require_role(user, ["REVIEWER", "ADMIN"])
    return user


def require_creator_or_above(
    user: UserContext = Depends(get_current_user_flexible),
) -> UserContext:
    """Require CREATOR, REVIEWER, or ADMIN role."""
    require_role(user, ["CREATOR", "REVIEWER", "ADMIN"])
    return user