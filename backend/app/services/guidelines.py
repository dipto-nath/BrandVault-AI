from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.models.guideline import BrandGuideline, GuidelineCategory, Severity
from app.schemas.guideline import BrandGuidelineCreate, BrandGuidelineUpdate
from app.services.audit import AuditService


class GuidelineService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_guideline(
        self,
        org_id: UUID,
        user_id: UUID,
        data: BrandGuidelineCreate,
    ) -> BrandGuideline:
        """Create a new brand guideline."""
        existing = await self.db.execute(
            select(BrandGuideline).where(
                BrandGuideline.org_id == org_id,
                BrandGuideline.rule_code == data.rule_code,
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Guideline with code '{data.rule_code}' already exists")
        
        guideline = BrandGuideline(
            org_id=org_id,
            **data.model_dump(),
            created_by=user_id,
        )
        self.db.add(guideline)
        await self.db.commit()
        await self.db.refresh(guideline)
        
        audit_service = AuditService(self.db)
        await audit_service.log(
            org_id=org_id,
            user_id=user_id,
            entity_type="brand_guideline",
            entity_id=guideline.id,
            action="CREATE",
            old_value=None,
            new_value={"rule_code": guideline.rule_code, "title": guideline.title},
        )
        
        return guideline

    async def update_guideline(
        self,
        guideline_id: UUID,
        org_id: UUID,
        data: BrandGuidelineUpdate,
    ) -> BrandGuideline:
        """Update a brand guideline."""
        result = await self.db.execute(
            select(BrandGuideline).where(
                BrandGuideline.id == guideline_id,
                BrandGuideline.org_id == org_id,
            )
        )
        guideline = result.scalar_one_or_none()
        if not guideline:
            raise ValueError("Guideline not found")
        
        old_values = {
            "title": guideline.title,
            "description": guideline.description,
            "category": guideline.category.value,
            "severity": guideline.severity.value,
            "active": guideline.active,
        }
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(guideline, field, value)
        
        guideline.version += 1
        
        await self.db.commit()
        await self.db.refresh(guideline)
        
        new_values = {
            "title": guideline.title,
            "description": guideline.description,
            "category": guideline.category.value,
            "severity": guideline.severity.value,
            "active": guideline.active,
            "version": guideline.version,
        }
        
        audit_service = AuditService(self.db)
        await audit_service.log(
            org_id=org_id,
            user_id=None,
            entity_type="brand_guideline",
            entity_id=guideline.id,
            action="UPDATE",
            old_value=old_values,
            new_value=new_values,
        )
        
        return guideline

    async def list_guidelines(
        self,
        org_id: UUID,
        active_only: bool = False,
        category: Optional[GuidelineCategory] = None,
    ) -> List[BrandGuideline]:
        """List all brand guidelines."""
        query = select(BrandGuideline).where(BrandGuideline.org_id == org_id)
        if active_only:
            query = query.where(BrandGuideline.active == True)
        if category:
            query = query.where(BrandGuideline.category == category)
        query = query.order_by(BrandGuideline.rule_code)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_guideline(
        self,
        guideline_id: UUID,
        org_id: UUID,
    ) -> Optional[BrandGuideline]:
        """Get a specific guideline."""
        result = await self.db.execute(
            select(BrandGuideline).where(
                BrandGuideline.id == guideline_id,
                BrandGuideline.org_id == org_id,
            )
        )
        return result.scalar_one_or_none()

    async def deactivate_guideline(
        self,
        guideline_id: UUID,
        org_id: UUID,
    ) -> bool:
        """Deactivate a guideline."""
        result = await self.db.execute(
            select(BrandGuideline).where(
                BrandGuideline.id == guideline_id,
                BrandGuideline.org_id == org_id,
            )
        )
        guideline = result.scalar_one_or_none()
        if not guideline:
            raise ValueError("Guideline not found")
        
        guideline.active = False
        await self.db.commit()
        
        audit_service = AuditService(self.db)
        await audit_service.log(
            org_id=org_id,
            user_id=None,
            entity_type="brand_guideline",
            entity_id=guideline.id,
            action="DEACTIVATE",
            old_value={"active": True},
            new_value={"active": False},
        )
        
        return True
