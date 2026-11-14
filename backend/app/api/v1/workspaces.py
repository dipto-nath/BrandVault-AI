from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user_flexible, get_db_with_org, require_admin
from app.models.organization import Organization, User, WorkspaceMember, WorkspaceRole
from app.schemas.auth import UserResponse, OrganizationResponse
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

from fastapi import HTTPException
