from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user_flexible, get_db_with_org, require_admin
from app.models.audit import AuditEvent
from app.schemas.audit import AuditEventResponse

router = APIRouter()


@router.get("", response_model=List[AuditEventResponse])
async def list_audit_events(
    entity_type: Optional[str] = None,
    entity_id: Optional[UUID] = None,
    limit: int = 100,
    offset: int = 0,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List audit events."""
    query = select(AuditEvent).where(AuditEvent.org_id == user.org_id)
    if entity_type:
        query = query.where(AuditEvent.entity_type == entity_type)
    if entity_id:
        query = query.where(AuditEvent.entity_id == entity_id)
    query = query.order_by(AuditEvent.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    events = result.scalars().all()
    return [AuditEventResponse.model_validate(e) for e in events]


@router.get("/{entity_type}/{entity_id}", response_model=List[AuditEventResponse])
async def get_entity_audit_trail(
    entity_type: str,
    entity_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get audit trail for a specific entity."""
    result = await db.execute(
        select(AuditEvent)
        .where(
            AuditEvent.org_id == user.org_id,
            AuditEvent.entity_type == entity_type,
            AuditEvent.entity_id == entity_id,
        )
        .order_by(AuditEvent.created_at.asc())
    )
    events = result.scalars().all()
    return [AuditEventResponse.model_validate(e) for e in events]
