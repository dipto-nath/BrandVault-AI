from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
from uuid import UUID

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    verify_password,
    get_password_hash,
    verify_token,
    UserContext,
)
from app.core.dependencies import get_current_user_flexible, get_db_with_org
from app.core.config import settings
from app.models.organization import Organization, User, WorkspaceMember, WorkspaceRole
from app.schemas.auth import (
    TokenResponse,
    LoginRequest,
    DemoLoginRequest,
    UserResponse,
    OrganizationResponse,
)
from app.services.audit import AuditService
import structlog

logger = structlog.get_logger()

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate user and return JWT token."""
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )

    org_result = await db.execute(
        select(Organization).where(Organization.id == user.org_id)
    )
    org = org_result.scalar_one_or_none()

    member_result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.org_id == user.org_id,
            WorkspaceMember.user_id == user.id,
        )
    )
    member = member_result.scalar_one_or_none()
    role = member.role if member else WorkspaceRole.CREATOR

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "org_id": str(user.org_id),
            "role": role.value,
            "email": user.email,
        },
        expires_delta=timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    )

    from datetime import datetime, timezone
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.id,
        entity_type="user",
        entity_id=user.id,
        action="LOGIN",
        old_value=None,
        new_value={"email": user.email},
    )

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
        organization=OrganizationResponse.model_validate(org),
    )


@router.post("/demo", response_model=TokenResponse)
async def demo_login(
    request: DemoLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create demo session for the specified workspace."""
    result = await db.execute(
        select(Organization).where(Organization.slug == request.workspace_slug)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Demo workspace '{request.workspace_slug}' not found",
        )

    demo_user_id = UUID(settings.DEMO_USER_ID)
    user_result = await db.execute(
        select(User).where(User.id == demo_user_id, User.org_id == org.id)
    )
    user = user_result.scalar_one_or_none()

    if not user:
        user = User(
            id=demo_user_id,
            org_id=org.id,
            email="demo@nexatech.example",
            full_name="Demo Reviewer",
            is_active=True,
        )
        db.add(user)
        await db.flush()

        member = WorkspaceMember(
            org_id=org.id,
            user_id=user.id,
            role=WorkspaceRole.ADMIN,
        )
        db.add(member)
        await db.commit()

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "org_id": str(org.id),
            "role": "ADMIN",
            "email": user.email,
        },
        expires_delta=timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
        organization=OrganizationResponse.model_validate(org),
    )


@router.get("/me", response_model=TokenResponse)
async def get_current_user_info(
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get current user information."""
    result = await db.execute(
        select(User).where(User.id == user.user_id)
    )
    user_obj = result.scalar_one_or_none()

    if not user_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    org_result = await db.execute(
        select(Organization).where(Organization.id == user.org_id)
    )
    org = org_result.scalar_one_or_none()

    member_result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.org_id == user.org_id,
            WorkspaceMember.user_id == user.user_id,
        )
    )
    member = member_result.scalar_one_or_none()

    return TokenResponse(
        access_token="",
        user=UserResponse.model_validate(user_obj),
        organization=OrganizationResponse.model_validate(org),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Refresh access token."""
    result = await db.execute(
        select(User).where(User.id == user.user_id)
    )
    user_obj = result.scalar_one_or_none()

    if not user_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    org_result = await db.execute(
        select(Organization).where(Organization.id == user.org_id)
    )
    org = org_result.scalar_one_or_none()

    access_token = create_access_token(
        data={
            "sub": str(user.user_id),
            "org_id": str(user.org_id),
            "role": user.role,
            "email": user.email,
        },
        expires_delta=timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user_obj),
        organization=OrganizationResponse.model_validate(org),
    )
