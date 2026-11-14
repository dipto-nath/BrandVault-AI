from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.models.fact import ApprovedFact, FactVerificationStatus
from app.models.source import Source
from app.schemas.fact import ApprovedFactCreate, ApprovedFactUpdate
from app.services.audit import AuditService


class FactService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_fact(
        self,
        org_id: UUID,
        user_id: UUID,
        data: ApprovedFactCreate,
    ) -> ApprovedFact:
        """Create a new approved fact."""
        # Check duplicate fact_code
        existing = await self.db.execute(
            select(ApprovedFact).where(
                ApprovedFact.org_id == org_id,
                ApprovedFact.fact_code == data.fact_code,
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Fact with code '{data.fact_code}' already exists")
        
        # Validate source document
        if data.source_document_id:
            source = await self.db.execute(
                select(Source).where(
                    Source.id == data.source_document_id,
                    Source.org_id == org_id,
                )
            )
            if not source.scalar_one_or_none():
                raise ValueError("Source document not found")
        
        fact = ApprovedFact(
            org_id=org_id,
            **data.model_dump(),
            created_by=user_id,
        )
        self.db.add(fact)
        await self.db.commit()
        await self.db.refresh(fact)
        
        audit_service = AuditService(self.db)
        await audit_service.log(
            org_id=org_id,
            user_id=user_id,
            entity_type="approved_fact",
            entity_id=fact.id,
            action="CREATE",
            old_value=None,
            new_value={"fact_code": fact.fact_code, "title": fact.title},
        )
        
        return fact

    async def update_fact(
        self,
        fact_id: UUID,
        org_id: UUID,
        data: ApprovedFactUpdate,
    ) -> ApprovedFact:
        """Update an approved fact."""
        result = await self.db.execute(
            select(ApprovedFact).where(
                ApprovedFact.id == fact_id,
                ApprovedFact.org_id == org_id,
            )
        )
        fact = result.scalar_one_or_none()
        if not fact:
            raise ValueError("Fact not found")
        
        old_values = {
            "title": fact.title,
            "fact_text": fact.fact_text,
            "verification_status": fact.verification_status.value,
        }
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(fact, field, value)
        
        await self.db.commit()
        await self.db.refresh(fact)
        
        new_values = {
            "title": fact.title,
            "fact_text": fact.fact_text,
            "verification_status": fact.verification_status.value,
        }
        
        audit_service = AuditService(self.db)
        await audit_service.log(
            org_id=org_id,
            user_id=None,  # Would be passed in real implementation
            entity_type="approved_fact",
            entity_id=fact.id,
            action="UPDATE",
            old_value=old_values,
            new_value=new_values,
        )
        
        return fact

    async def list_facts(
        self,
        org_id: UUID,
        active_only: bool = True,
    ) -> List[ApprovedFact]:
        """List all approved facts."""
        query = select(ApprovedFact).where(ApprovedFact.org_id == org_id)
        if active_only:
            query = query.where(ApprovedFact.verification_status == FactVerificationStatus.APPROVED)
        query = query.order_by(ApprovedFact.created_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_facts_for_verification(
        self,
        org_id: UUID,
        entity: str,
        attribute: str,
    ) -> List[ApprovedFact]:
        """Get facts matching entity and attribute for verification."""
        result = await self.db.execute(
            select(ApprovedFact).where(
                ApprovedFact.org_id == org_id,
                ApprovedFact.entity_name == entity,
                ApprovedFact.attribute_name == attribute,
                ApprovedFact.verification_status == FactVerificationStatus.APPROVED,
            )
        )
        return result.scalars().all()

    async def bulk_import_facts(
        self,
        org_id: UUID,
        user_id: UUID,
        facts: List[ApprovedFactCreate],
    ) -> List[ApprovedFact]:
        """Bulk import facts."""
        created = []
        for fact_data in facts:
            try:
                fact = await self.create_fact(org_id, user_id, fact_data)
                created.append(fact)
            except ValueError as e:
                logger.warning("fact_import_skipped", fact_code=fact_data.fact_code, error=str(e))
        return created


import structlog
logger = structlog.get_logger()
