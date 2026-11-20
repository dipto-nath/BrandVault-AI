import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.core.config import settings
from app.core.security import (
    create_access_token,
    verify_password,
    get_password_hash,
    UserContext,
)
from app.models.organization import (
    Organization,
    User,
    WorkspaceMember,
    WorkspaceRole,
    RefreshToken,
)
from app.models.guideline_template import GuidelineTemplate
from app.models.guideline import BrandGuideline
from app.schemas.auth import (
    RegisterRequest,
    RegisterFormRequest,
    TokenResponse,
    UserResponse,
    OrganizationResponse,
)
from app.services.audit import AuditService

logger = structlog.get_logger()


def slugify(text: str) -> str:
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text or "workspace"


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)

    async def register_company(self, req: RegisterRequest) -> TokenResponse:
        # Check if user email already exists
        existing_user = await self.db.execute(
            select(User).where(User.email == req.email)
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists",
            )

        # Generate unique workspace slug
        base_slug = req.workspace_slug or slugify(req.company_name)
        slug = base_slug
        existing_org = await self.db.execute(
            select(Organization).where(Organization.slug == slug)
        )
        counter = 1
        while existing_org.scalar_one_or_none():
            slug = f"{base_slug}-{counter}"
            existing_org = await self.db.execute(
                select(Organization).where(Organization.slug == slug)
            )
            counter += 1

        # Create Organization
        org = Organization(
            name=req.company_name,
            slug=slug,
            industry=req.industry,
            plan="TRIAL",
            is_demo=False,
            onboarding_state="PENDING",
        )
        self.db.add(org)
        await self.db.flush()

        # Create Admin User
        user = User(
            org_id=org.id,
            email=req.email,
            hashed_password=get_password_hash(req.password),
            full_name=req.full_name,
            is_active=True,
            email_verified_at=datetime.now(timezone.utc),
            last_login_at=datetime.now(timezone.utc),
        )
        self.db.add(user)
        await self.db.flush()

        # Create Workspace Membership as ADMIN
        membership = WorkspaceMember(
            org_id=org.id,
            user_id=user.id,
            role=WorkspaceRole.ADMIN,
            status="ACTIVE",
        )
        self.db.add(membership)

        # Seed starter guidelines for this industry if templates exist
        templates_query = select(GuidelineTemplate).where(
            GuidelineTemplate.industry.in_(["ALL", req.industry or "GENERAL"])
        )
        templates_res = await self.db.execute(templates_query)
        templates = templates_res.scalars().all()
        for tpl in templates:
            guideline = BrandGuideline(
                org_id=org.id,
                rule_code=tpl.rule_code,
                title=tpl.title,
                description=tpl.description,
                category=tpl.category,
                severity=tpl.severity,
                examples=tpl.examples,
            )
            self.db.add(guideline)

        # Issue Tokens
        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "org_id": str(org.id),
                "role": WorkspaceRole.ADMIN.value,
                "email": user.email,
            },
            expires_delta=timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
        )

        refresh_token_str = secrets.token_urlsafe(64)
        refresh_expires = datetime.now(timezone.utc) + timedelta(days=30)
        refresh_rec = RefreshToken(
            user_id=user.id,
            org_id=org.id,
            token_hash=refresh_token_str,
            expires_at=refresh_expires,
        )
        self.db.add(refresh_rec)
        await self.db.commit()

        # Audit event
        await self.audit_service.log(
            org_id=org.id,
            user_id=user.id,
            entity_type="organization",
            entity_id=org.id,
            action="CREATE",
            old_value=None,
            new_value={"name": org.name, "slug": org.slug, "created_by": user.email},
        )

        user_resp = UserResponse.model_validate(user)
        user_resp.role = WorkspaceRole.ADMIN.value
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token_str,
            user=user_resp,
            organization=OrganizationResponse.model_validate(org),
        )

    async def register_company_with_documents(self, req: RegisterFormRequest, db) -> TokenResponse:
        """Register a company with optional source documents (PDFs)."""
        # First register the company normally
        result = await self.register_company(RegisterRequest(
            company_name=req.company_name,
            workspace_slug=req.workspace_slug,
            email=req.email,
            password=req.password,
            full_name=req.full_name,
            industry=req.industry,
        ))
        
        # If there are source documents, create them in the database
        if req.sourceDocuments:
            # Get the org from the result
            org_id = result.organization.id
            user_id = result.user.id
            
            # Import source model
            from app.models.source import Source, SourceStatus
            
            for file in req.sourceDocuments:
                content = await file.read()
                # For PDF files, we'll store the raw content
                # In production, you'd use a proper PDF parser
                extracted_text = content.decode('utf-8', errors='ignore')[:50000]
                
                source = Source(
                    org_id=org_id,
                    filename=file.filename,
                    storage_path=f"uploads/{file.filename}",
                    mime_type='application/pdf',
                    file_size=len(content),
                    source_name=file.filename,
                    document_status=SourceStatus.APPROVED,
                    extracted_text=extracted_text,
                    extraction_error=None,
                    uploaded_by=user_id,
                )
                db.add(source)
            
            await db.commit()
        
        return result


    async def login(self, email: str, password: str) -> TokenResponse:
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if not user or not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled",
            )

        org_result = await self.db.execute(
            select(Organization).where(Organization.id == user.org_id)
        )
        org = org_result.scalar_one_or_none()
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found",
            )

        member_result = await self.db.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.org_id == user.org_id,
                WorkspaceMember.user_id == user.id,
            )
        )
        member = member_result.scalar_one_or_none()
        role_str = member.role.value if member else WorkspaceRole.CREATOR.value

        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "org_id": str(user.org_id),
                "role": role_str,
                "email": user.email,
            },
            expires_delta=timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
        )

        refresh_token_str = secrets.token_urlsafe(64)
        refresh_expires = datetime.now(timezone.utc) + timedelta(days=30)
        refresh_rec = RefreshToken(
            user_id=user.id,
            org_id=user.org_id,
            token_hash=refresh_token_str,
            expires_at=refresh_expires,
        )
        self.db.add(refresh_rec)

        user.last_login_at = datetime.now(timezone.utc)
        await self.db.commit()

        await self.audit_service.log(
            org_id=user.org_id,
            user_id=user.id,
            entity_type="user",
            entity_id=user.id,
            action="LOGIN",
            old_value=None,
            new_value={"email": user.email},
        )

        user_resp = UserResponse.model_validate(user)
        user_resp.role = role_str
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token_str,
            user=user_resp,
            organization=OrganizationResponse.model_validate(org),
        )

    async def refresh_tokens(self, refresh_token_str: str) -> TokenResponse:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(RefreshToken).where(
                and_(
                    RefreshToken.token_hash == refresh_token_str,
                    RefreshToken.revoked_at.is_(None),
                    RefreshToken.expires_at > now,
                )
            )
        )
        token_rec = result.scalar_one_or_none()
        if not token_rec:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        # Revoke old refresh token (rotation)
        token_rec.revoked_at = now

        # Fetch user & org
        user_res = await self.db.execute(select(User).where(User.id == token_rec.user_id))
        user = user_res.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive")

        org_res = await self.db.execute(select(Organization).where(Organization.id == token_rec.org_id))
        org = org_res.scalar_one_or_none()

        member_res = await self.db.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.org_id == user.org_id,
                WorkspaceMember.user_id == user.id,
            )
        )
        member = member_res.scalar_one_or_none()
        role_str = member.role.value if member else WorkspaceRole.CREATOR.value

        new_access_token = create_access_token(
            data={
                "sub": str(user.id),
                "org_id": str(user.org_id),
                "role": role_str,
                "email": user.email,
            },
            expires_delta=timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
        )

        new_refresh_str = secrets.token_urlsafe(64)
        new_refresh_rec = RefreshToken(
            user_id=user.id,
            org_id=user.org_id,
            token_hash=new_refresh_str,
            expires_at=now + timedelta(days=30),
        )
        self.db.add(new_refresh_rec)
        await self.db.commit()

        user_resp = UserResponse.model_validate(user)
        user_resp.role = role_str
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_str,
            user=user_resp,
            organization=OrganizationResponse.model_validate(org),
        )

    async def logout(self, refresh_token_str: Optional[str] = None, user_id: Optional[UUID] = None) -> None:
        now = datetime.now(timezone.utc)
        if refresh_token_str:
            res = await self.db.execute(
                select(RefreshToken).where(RefreshToken.token_hash == refresh_token_str)
            )
            rec = res.scalar_one_or_none()
            if rec:
                rec.revoked_at = now
                await self.db.commit()
        elif user_id:
            res = await self.db.execute(
                select(RefreshToken).where(
                    and_(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
                )
            )
            for rec in res.scalars().all():
                rec.revoked_at = now
            await self.db.commit()
