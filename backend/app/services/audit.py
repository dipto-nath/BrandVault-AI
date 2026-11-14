from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import Request

from app.models.audit import AuditEvent


class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        org_id: UUID,
        user_id: Optional[UUID],
        entity_type: str,
        entity_id: UUID,
        action: str,
        old_value: Optional[Dict[str, Any]],
        new_value: Optional[Dict[str, Any]],
        metadata: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None,
    ) -> None:
        """Log an audit event."""
        ip_address = None
        user_agent = None
        
        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")

        audit = AuditEvent(
            org_id=org_id,
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            old_value=old_value,
            new_value=new_value,
            metadata=metadata or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(audit)
        # Note: commit is handled by caller

    async def get_audit_trail(
        self,
        org_id: UUID,
        entity_type: str,
        entity_id: UUID,
        limit: int = 100,
    ) -> List[AuditEvent]:
        """Get audit trail for a specific entity."""
        result = await self.db.execute(
            select(AuditEvent)
            .where(
                AuditEvent.org_id == org_id,
                AuditEvent.entity_type == entity_type,
                AuditEvent.entity_id == entity_id,
            )
            .order_by(AuditEvent.created_at.asc())
            .limit(limit)
        )
        return result.scalars().all()

    async def get_org_audit(
        self,
        org_id: UUID,
        limit: int = 100,
        offset: int = 0,
    ) -> List[AuditEvent]:
        """Get all audit events for organization."""
        result = await self.db.execute(
            select(AuditEvent)
            .where(AuditEvent.org_id == org_id)
            .order_by(AuditEvent.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()
