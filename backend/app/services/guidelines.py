from datetime import datetime, timezone
from typing import List, Optional, Dict
from uuid import UUID, uuid4
import secrets
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import structlog

from app.models.guideline import BrandGuideline, GuidelineCategory, Severity
from app.models.guideline_template import GuidelineTemplate
from app.models.guideline_candidate import GuidelineCandidate
from app.models.fact_candidate import CandidateStatus
from app.schemas.guideline import BrandGuidelineCreate, BrandGuidelineUpdate
from app.schemas.guideline_template import GuidelineCandidateCreate
from app.services.audit import AuditService

logger = structlog.get_logger()

# Standard industry starter guidelines
BUILTIN_TEMPLATES = [
    {
        "industry": "Consumer Tech & Hardware",
        "rule_code": "RULE-CLAIM-001",
        "title": "Substantiated Performance Claims",
        "description": "All hardware performance, battery longevity, and weight figures must match certified laboratory specifications.",
        "category": GuidelineCategory.CLAIMS,
        "severity": Severity.HIGH,
        "examples": {
            "good": ["Up to 48 hours of battery life under standard test conditions"],
            "bad": ["Infinite battery life", "World's fastest phone without citation"],
        },
    },
    {
        "industry": "Consumer Tech & Hardware",
        "rule_code": "RULE-TONE-002",
        "title": "Confident, Unpretentious Tone",
        "description": "Speak plainly and directly about what the device actually does. Avoid hollow hype and unsubstantiated superlatives.",
        "category": GuidelineCategory.TONE,
        "severity": Severity.MEDIUM,
        "examples": {
            "good": ["Engineered for smooth multi-tasking"],
            "bad": ["The revolutionary miracle device that changes everything"],
        },
    },
    {
        "industry": "B2B SaaS & Enterprise Software",
        "rule_code": "RULE-LEGAL-001",
        "title": "Uptime & SLA Precision",
        "description": "Never promise 100% uptime. Cite the standard SLA of 99.9% as defined in enterprise contracts.",
        "category": GuidelineCategory.LEGAL,
        "severity": Severity.HIGH,
        "examples": {
            "good": ["Backed by our 99.9% enterprise uptime SLA"],
            "bad": ["Guaranteed zero downtime ever"],
        },
    },
    {
        "industry": "Health & Wellness",
        "rule_code": "RULE-LEGAL-002",
        "title": "No Medical Treatment Claims",
        "description": "Do not state or imply that products diagnose, treat, cure, or prevent any medical condition without formal regulatory clearance.",
        "category": GuidelineCategory.LEGAL,
        "severity": Severity.HIGH,
        "examples": {
            "good": ["Supports everyday physical wellbeing"],
            "bad": ["Cures insomnia and eliminates chronic fatigue"],
        },
    },
    {
        "industry": "E-commerce & Retail",
        "rule_code": "RULE-TERM-001",
        "title": "Accurate Return Policy Terminology",
        "description": "Clearly state the exact return window (30-day inspection period) and conditions. Do not state unconditional refunds.",
        "category": GuidelineCategory.TERMINOLOGY,
        "severity": Severity.MEDIUM,
        "examples": {
            "good": ["Hassle-free 30-day return policy"],
            "bad": ["Keep it forever and get your money back anytime"],
        },
    },
]


class GuidelineService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)

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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Guideline with code '{data.rule_code}' already exists",
            )

        guideline = BrandGuideline(
            org_id=org_id,
            **data.model_dump(),
            created_by=user_id,
        )
        self.db.add(guideline)
        await self.db.commit()
        await self.db.refresh(guideline)

        await self.audit_service.log(
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
        user_id: Optional[UUID] = None,
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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guideline not found",
            )

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

        await self.audit_service.log(
            org_id=org_id,
            user_id=user_id,
            entity_type="brand_guideline",
            entity_id=guideline.id,
            action="UPDATE",
            old_value=old_values,
            new_value={
                "title": guideline.title,
                "category": guideline.category.value,
                "severity": guideline.severity.value,
                "active": guideline.active,
                "version": guideline.version,
            },
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
        return list(result.scalars().all())

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
        guideline = result.scalar_one_or_none()
        if not guideline:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guideline not found",
            )
        return guideline

    async def deactivate_guideline(
        self,
        guideline_id: UUID,
        org_id: UUID,
        user_id: Optional[UUID] = None,
    ) -> bool:
        """Deactivate a guideline."""
        guideline = await self.get_guideline(guideline_id, org_id)
        guideline.active = False
        await self.db.commit()

        await self.audit_service.log(
            org_id=org_id,
            user_id=user_id,
            entity_type="brand_guideline",
            entity_id=guideline.id,
            action="DEACTIVATE",
            old_value={"active": True},
            new_value={"active": False},
        )
        return True

    # =========================================================================
    # Starter Templates Catalog & 1-Click Cloning
    # =========================================================================

    async def list_templates(self, industry: Optional[str] = None) -> List[GuidelineTemplate]:
        """List pre-built starter guideline templates, seeding defaults if needed."""
        # Ensure default templates exist
        count_res = await self.db.execute(select(GuidelineTemplate))
        existing_count = len(count_res.scalars().all())
        if existing_count == 0:
            for item in BUILTIN_TEMPLATES:
                tpl = GuidelineTemplate(
                    industry=item["industry"],
                    rule_code=item["rule_code"],
                    title=item["title"],
                    description=item["description"],
                    category=item["category"],
                    severity=item["severity"],
                    examples=item["examples"],
                )
                self.db.add(tpl)
            await self.db.commit()

        query = select(GuidelineTemplate)
        if industry:
            query = query.where(
                GuidelineTemplate.industry.in_(["ALL", industry])
            )
        query = query.order_by(GuidelineTemplate.rule_code)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def clone_templates(
        self,
        org_id: UUID,
        user_id: UUID,
        template_ids: List[UUID],
    ) -> List[BrandGuideline]:
        """Clone selected starter templates into active workspace."""
        templates_res = await self.db.execute(
            select(GuidelineTemplate).where(GuidelineTemplate.id.in_(template_ids))
        )
        templates = templates_res.scalars().all()

        cloned = []
        for tpl in templates:
            # Check if already cloned
            existing = await self.db.execute(
                select(BrandGuideline).where(
                    and_(BrandGuideline.org_id == org_id, BrandGuideline.rule_code == tpl.rule_code)
                )
            )
            if existing.scalar_one_or_none():
                continue

            guideline = BrandGuideline(
                org_id=org_id,
                rule_code=tpl.rule_code,
                title=tpl.title,
                description=tpl.description,
                category=tpl.category,
                severity=tpl.severity,
                examples=tpl.examples,
                created_by=user_id,
            )
            self.db.add(guideline)
            cloned.append(guideline)

        if cloned:
            await self.db.commit()
            for g in cloned:
                await self.db.refresh(g)

        await self.audit_service.log(
            org_id=org_id,
            user_id=user_id,
            entity_type="brand_guideline",
            entity_id=org_id,
            action="CLONE_TEMPLATES",
            old_value=None,
            new_value={"cloned_count": len(cloned)},
        )

        return cloned

    # =========================================================================
    # Guideline Candidate Queue
    # =========================================================================

    async def list_candidates(
        self,
        org_id: UUID,
        status_filter: Optional[CandidateStatus] = None,
    ) -> List[GuidelineCandidate]:
        query = select(GuidelineCandidate).where(GuidelineCandidate.org_id == org_id)
        if status_filter:
            query = query.where(GuidelineCandidate.status == status_filter)
        query = query.order_by(GuidelineCandidate.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_candidate(
        self,
        org_id: UUID,
        candidate_id: UUID,
    ) -> GuidelineCandidate:
        res = await self.db.execute(
            select(GuidelineCandidate).where(
                and_(GuidelineCandidate.org_id == org_id, GuidelineCandidate.id == candidate_id)
            )
        )
        cand = res.scalar_one_or_none()
        if not cand:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return cand

    async def create_candidate(
        self,
        org_id: UUID,
        data: GuidelineCandidateCreate,
    ) -> GuidelineCandidate:
        candidate = GuidelineCandidate(
            org_id=org_id,
            product_id=data.product_id,
            source_id=data.source_id,
            rule_code=data.rule_code,
            title=data.title,
            description=data.description,
            category=data.category,
            severity=data.severity,
            examples=data.examples,
            confidence=data.confidence,
            status=CandidateStatus.PENDING,
        )
        self.db.add(candidate)
        await self.db.commit()
        await self.db.refresh(candidate)
        return candidate

    async def approve_candidate(
        self,
        org_id: UUID,
        user_id: UUID,
        candidate_id: UUID,
    ) -> BrandGuideline:
        res = await self.db.execute(
            select(GuidelineCandidate).where(
                and_(GuidelineCandidate.org_id == org_id, GuidelineCandidate.id == candidate_id)
            )
        )
        cand = res.scalar_one_or_none()
        if not cand:
            raise HTTPException(status_code=404, detail="Candidate not found")

        rule_code = cand.rule_code or f"RULE-{cand.category.value[:4]}-{secrets.token_hex(2).upper()}"
        guideline = BrandGuideline(
            org_id=org_id,
            rule_code=rule_code,
            title=cand.title,
            description=cand.description,
            category=cand.category,
            severity=cand.severity,
            examples=cand.examples,
            created_by=user_id,
        )
        self.db.add(guideline)

        cand.status = CandidateStatus.APPROVED
        cand.reviewed_by = user_id
        cand.reviewed_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(guideline)

        await self.audit_service.log(
            org_id=org_id,
            user_id=user_id,
            entity_type="brand_guideline",
            entity_id=guideline.id,
            action="APPROVE_CANDIDATE",
            old_value={"candidate_id": str(cand.id)},
            new_value={"rule_code": guideline.rule_code, "title": guideline.title},
        )
        return guideline

    async def reject_candidate(
        self,
        org_id: UUID,
        user_id: UUID,
        candidate_id: UUID,
    ) -> GuidelineCandidate:
        res = await self.db.execute(
            select(GuidelineCandidate).where(
                and_(GuidelineCandidate.org_id == org_id, GuidelineCandidate.id == candidate_id)
            )
        )
        cand = res.scalar_one_or_none()
        if not cand:
            raise HTTPException(status_code=404, detail="Candidate not found")

        cand.status = CandidateStatus.REJECTED
        cand.reviewed_by = user_id
        cand.reviewed_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(cand)
        return cand
