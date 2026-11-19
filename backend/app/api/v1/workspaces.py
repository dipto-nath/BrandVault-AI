from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID, uuid4
from datetime import datetime, timezone, timedelta
import secrets
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user_flexible, get_db_with_org, require_admin
from app.models.organization import Organization, User, WorkspaceMember, WorkspaceRole, Invitation
from app.schemas.auth import (
    UserResponse,
    OrganizationResponse,
    UpdateMemberRoleRequest,
    InviteMemberRequest,
    InvitationResponse,
)
from app.schemas.content import ContentResponse
from app.services.audit import AuditService

router = APIRouter()


@router.get("/current", response_model=OrganizationResponse)
async def get_current_workspace(
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get current workspace/organization."""
    result = await db.execute(
        select(Organization).where(Organization.id == user.org_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return OrganizationResponse.model_validate(org)


@router.get("/current/members", response_model=List[dict])
async def get_workspace_members(
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get workspace members with user details."""
    result = await db.execute(
        select(WorkspaceMember, User)
        .join(User, WorkspaceMember.user_id == User.id)
        .where(WorkspaceMember.org_id == user.org_id)
    )
    members = []
    for member, member_user in result.all():
        members.append({
            "id": str(member.id),
            "user_id": str(member.user_id),
            "role": member.role.value,
            "joined_at": member.joined_at.isoformat(),
            "user": {
                "id": str(member_user.id),
                "email": member_user.email,
                "full_name": member_user.full_name,
                "avatar_url": member_user.avatar_url,
            },
        })
    return members


@router.get("/current/dashboard")
async def get_dashboard_stats(
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get dashboard statistics."""
    from app.models.content import ContentItem, ContentStatus, RiskLevel
    from sqlalchemy import func

    # Total submissions
    total_result = await db.execute(
        select(func.count(ContentItem.id)).where(ContentItem.org_id == user.org_id)
    )
    total = total_result.scalar() or 0

    # Status counts
    status_result = await db.execute(
        select(ContentItem.status, func.count(ContentItem.id))
        .where(ContentItem.org_id == user.org_id)
        .group_by(ContentItem.status)
    )
    status_counts = {row[0].value: row[1] for row in status_result.all()}

    # Risk level counts
    risk_result = await db.execute(
        select(ContentItem.risk_level, func.count(ContentItem.id))
        .where(ContentItem.org_id == user.org_id)
        .group_by(ContentItem.risk_level)
    )
    risk_counts = {row[0].value if row[0] else None: row[1] for row in risk_result.all()}

    # Recent submissions
    recent_result = await db.execute(
        select(ContentItem)
        .where(ContentItem.org_id == user.org_id)
        .order_by(ContentItem.created_at.desc())
        .limit(8)
    )
    recent = recent_result.scalars().all()

    return {
        "total": total,
        "pending": status_counts.get("NEEDS_REVIEW", 0) + status_counts.get("CHANGES_REQUESTED", 0),
        "approved": status_counts.get("APPROVED", 0),
        "rejected": status_counts.get("REJECTED", 0),
        "high_risk": risk_counts.get("HIGH", 0),
        "recent": [ContentResponse.model_validate(r) for r in recent],
    }


@router.patch("/current/members/{target_user_id}")
async def update_member_role(
    target_user_id: UUID,
    request: UpdateMemberRoleRequest,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Change workspace member role (admin or manager only)."""
    if getattr(user, "is_demo", False) or str(user.org_id) == "11111111-1111-1111-1111-111111111111":
        raise HTTPException(status_code=403, detail="Demo workspace members cannot be modified")

    res = await db.execute(
        select(WorkspaceMember).where(
            and_(WorkspaceMember.org_id == user.org_id, WorkspaceMember.user_id == target_user_id)
        )
    )
    member = res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    try:
        new_role = WorkspaceRole(request.role.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {request.role}")

    member.role = new_role
    await db.commit()
    await db.refresh(member)

    return {"status": "ok", "user_id": str(target_user_id), "role": member.role.value}


@router.get("/current/invitations", response_model=List[InvitationResponse])
async def list_invitations(
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List pending invitations for the workspace."""
    res = await db.execute(
        select(Invitation)
        .where(Invitation.org_id == user.org_id, Invitation.accepted_at.is_(None))
        .order_by(Invitation.created_at.desc())
    )
    invites = res.scalars().all()
    return [
        InvitationResponse(
            id=inv.id,
            org_id=inv.org_id,
            email=inv.email,
            role=inv.role.value,
            created_at=inv.created_at,
            expires_at=inv.expires_at,
        )
        for inv in invites
    ]


@router.post("/current/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    request: InviteMemberRequest,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Invite a new member to the workspace."""
    if getattr(user, "is_demo", False):
        raise HTTPException(status_code=403, detail="Demo workspace cannot invite members")

    # Check if already a member
    existing_user_res = await db.execute(
        select(User).where(and_(User.org_id == user.org_id, User.email == request.email.lower()))
    )
    if existing_user_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User is already a member of this workspace")

    try:
        target_role = WorkspaceRole(request.role.upper())
    except ValueError:
        target_role = WorkspaceRole.CREATOR

    token = secrets.token_urlsafe(32)
    invitation = Invitation(
        org_id=user.org_id,
        email=request.email.lower(),
        role=target_role,
        token_hash=token,
        invited_by=user.user_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)

    return InvitationResponse(
        id=invitation.id,
        org_id=invitation.org_id,
        email=invitation.email,
        role=invitation.role.value,
        created_at=invitation.created_at,
        expires_at=invitation.expires_at,
    )


@router.delete("/current/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invitation(
    invitation_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Revoke a workspace invitation."""
    if getattr(user, "is_demo", False):
        raise HTTPException(status_code=403, detail="Demo workspace cannot modify invitations")

    res = await db.execute(
        select(Invitation).where(
            and_(Invitation.org_id == user.org_id, Invitation.id == invitation_id)
        )
    )
    inv = res.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")

    await db.delete(inv)
    await db.commit()

