from typing import Optional, List
from uuid import UUID
from fastapi import Depends, HTTPException, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import db_manager, get_db
from app.core.security import (
    verify_token,
    UserContext,
    require_role,
    TokenPayload,
)
from app.core.config import settings
from app.models.organization import Organization
import structlog

logger = structlog.get_logger()

DEMO_ORG_ID = UUID("11111111-1111-1111-1111-111111111111")


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
    try:
        payload = verify_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )

    org_uuid = UUID(payload.org_id)
    is_demo = (org_uuid == DEMO_ORG_ID) or getattr(payload, "is_demo", False)

    return UserContext(
        user_id=UUID(payload.sub),
        org_id=org_uuid,
        role=payload.role,
        email=payload.email,
        is_demo=is_demo,
    )


async def get_current_user_demo(
    db: AsyncSession = Depends(get_db),
) -> UserContext:
    """Demo mode user context."""
    return UserContext(
        user_id=UUID(settings.DEMO_USER_ID),
        org_id=DEMO_ORG_ID,
        role="ADMIN",
        email="demo@nexatech.example",
        full_name="Demo Reviewer",
        is_demo=True,
    )


async def get_current_user_flexible(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> UserContext:
    """Flexible auth - uses demo if allowed and no token, otherwise validates JWT."""
    if not authorization or not authorization.startswith("Bearer "):
        if not settings.ALLOW_DEMO_AUTH:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
            )

        # Return demo user
        user = UserContext(
            user_id=UUID(settings.DEMO_USER_ID),
            org_id=DEMO_ORG_ID,
            role="ADMIN",
            email="demo@nexatech.example",
            full_name="Demo Reviewer",
            is_demo=True,
        )
    else:
        token = authorization[7:]
        try:
            payload = verify_token(token)
            user_org_uuid = UUID(payload.org_id)
            is_demo = (user_org_uuid == DEMO_ORG_ID) or bool(getattr(payload, "is_demo", False))
            user = UserContext(
                user_id=UUID(payload.sub),
                org_id=user_org_uuid,
                role=payload.role,
                email=payload.email,
                is_demo=is_demo,
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token",
            )

    # Demo workspace protection: disallow mutation requests (POST, PUT, PATCH, DELETE)
    # except for login/demo auth endpoints
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        path = request.url.path
        if not (path.endswith("/auth/demo") or path.endswith("/auth/login") or path.endswith("/auth/register")):
            # Check if current org is demo
            if user.org_id == DEMO_ORG_ID or user.is_demo:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="The demo workspace is read-only. Please create a new company account to add or edit data.",
                )

    return user


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


def require_manager_or_admin(
    user: UserContext = Depends(get_current_user_flexible),
) -> UserContext:
    """Require MANAGER or ADMIN role."""
    require_role(user, ["MANAGER", "ADMIN"])
    return user


def require_reviewer_or_admin(
    user: UserContext = Depends(get_current_user_flexible),
) -> UserContext:
    """Require REVIEWER, MANAGER, or ADMIN role."""
    require_role(user, ["REVIEWER", "MANAGER", "ADMIN"])
    return user


def require_creator_or_above(
    user: UserContext = Depends(get_current_user_flexible),
) -> UserContext:
    """Require CREATOR, REVIEWER, MANAGER, or ADMIN role."""
    require_role(user, ["CREATOR", "REVIEWER", "MANAGER", "ADMIN", "AGENCY"])
    return user
