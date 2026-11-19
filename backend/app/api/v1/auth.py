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
    RegisterRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    DemoLoginRequest,
    UserResponse,
    OrganizationResponse,
)
from app.services.auth import AuthService
from app.services.audit import AuditService
import structlog

logger = structlog.get_logger()

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new company and admin user."""
    auth_service = AuthService(db)
    return await auth_service.register_company(request)


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate user and return JWT token."""
    auth_service = AuthService(db)
    return await auth_service.login(request.email, request.password)


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
        # Auto-create demo workspace if not seeded yet
        org = Organization(
            name="NexaTech",
            slug=request.workspace_slug,
            description="Leading AI hardware and robotics consumer technology",
            industry="Consumer Electronics",
            is_demo=True,
            plan="ENTERPRISE",
            onboarding_state="COMPLETED",
        )
        db.add(org)
        await db.flush()

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
            status="ACTIVE",
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

    user_resp = UserResponse.model_validate(user)
    user_resp.role = "ADMIN"

    return TokenResponse(
        access_token=access_token,
        refresh_token="demo-refresh-token",
        user=user_resp,
        organization=OrganizationResponse.model_validate(org),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token using refresh token."""
    auth_service = AuthService(db)
    return await auth_service.refresh_tokens(request.refresh_token)


@router.post("/logout")
async def logout(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Revoke refresh token on logout."""
    auth_service = AuthService(db)
    await auth_service.logout(refresh_token_str=request.refresh_token)
    return {"status": "ok"}


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Request password reset."""
    logger.info("password_reset_requested", email=request.email)
    # Return 200 without leaking if email exists
    return {"message": "If this email exists in our records, a reset link will be sent."}


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

    user_resp = UserResponse.model_validate(user_obj)
    user_resp.role = user.role

    return TokenResponse(
        access_token="",
        user=user_resp,
        organization=OrganizationResponse.model_validate(org),
    )
