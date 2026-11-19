from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID, uuid4
import secrets
from fastapi import HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.models.fact import ApprovedFact, FactVerificationStatus
from app.models.fact_candidate import FactCandidate, CandidateStatus
from app.models.source import Source
from app.models.product import Product
from app.schemas.fact import ApprovedFactCreate, ApprovedFactUpdate
from app.schemas.fact_candidate import (
    FactCandidateCreate,
    FactCandidateUpdate,
    FactCandidateResponse,
    ApproveCandidateRequest,
)
from app.services.audit import AuditService

logger = structlog.get_logger()


class FactService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)

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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Fact with code '{data.fact_code}' already exists",
            )

        # Validate source document if provided
        if data.source_document_id:
            src_res = await self.db.execute(
                select(Source).where(
                    Source.id == data.source_document_id,
                    Source.org_id == org_id,
                )
            )
            if not src_res.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Source document not found",
                )

        fact = ApprovedFact(
            org_id=org_id,
            **data.model_dump(),
            created_by=user_id,
        )
        self.db.add(fact)
        await self.db.commit()
        await self.db.refresh(fact)

        await self.audit_service.log(
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
        user_id: Optional[UUID] = None,
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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fact not found",
            )

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

        await self.audit_service.log(
            org_id=org_id,
            user_id=user_id,
            entity_type="approved_fact",
            entity_id=fact.id,
            action="UPDATE",
            old_value=old_values,
            new_value={
                "title": fact.title,
                "fact_text": fact.fact_text,
                "verification_status": fact.verification_status.value,
            },
        )

        return fact

    async def list_facts(
        self,
        org_id: UUID,
        active_only: bool = True,
        product_id: Optional[UUID] = None,
    ) -> List[ApprovedFact]:
        """List all approved facts with optional product and status filtering."""
        query = select(ApprovedFact).where(ApprovedFact.org_id == org_id)
        if active_only:
            query = query.where(ApprovedFact.verification_status == FactVerificationStatus.APPROVED)
        if product_id:
            query = query.where(ApprovedFact.product_id == product_id)

        query = query.order_by(ApprovedFact.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    # =========================================================================
    # Candidate Extraction Queue & Human Review Workflow
    # =========================================================================

    async def list_candidates(
        self,
        org_id: UUID,
        product_id: Optional[UUID] = None,
        status_filter: Optional[CandidateStatus] = None,
    ) -> List[FactCandidate]:
        """List ground truth fact candidates."""
        query = select(FactCandidate).where(FactCandidate.org_id == org_id)
        if status_filter:
            query = query.where(FactCandidate.status == status_filter)
        if product_id:
            query = query.where(FactCandidate.product_id == product_id)

        query = query.order_by(FactCandidate.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_candidate(
        self,
        org_id: UUID,
        data: FactCandidateCreate,
    ) -> FactCandidate:
        """Create a candidate extracted from a source document."""
        candidate = FactCandidate(
            org_id=org_id,
            product_id=data.product_id,
            source_id=data.source_id,
            entity=data.entity,
            attribute=data.attribute,
            value_text=data.value_text,
            value_numeric=data.value_numeric,
            unit=data.unit,
            qualifier=data.qualifier,
            source_page=data.source_page,
            excerpt=data.excerpt,
            confidence=data.confidence,
            status=CandidateStatus.PENDING,
        )
        self.db.add(candidate)
        await self.db.commit()
        await self.db.refresh(candidate)
        return candidate

    async def update_candidate(
        self,
        org_id: UUID,
        candidate_id: UUID,
        data: FactCandidateUpdate,
    ) -> FactCandidate:
        """Edit candidate details before approving."""
        res = await self.db.execute(
            select(FactCandidate).where(
                and_(FactCandidate.org_id == org_id, FactCandidate.id == candidate_id)
            )
        )
        cand = res.scalar_one_or_none()
        if not cand:
            raise HTTPException(status_code=404, detail="Candidate not found")

        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(cand, key, val)
        cand.status = CandidateStatus.EDITED
        await self.db.commit()
        await self.db.refresh(cand)
        return cand

    async def approve_candidate(
        self,
        org_id: UUID,
        user_id: UUID,
        candidate_id: UUID,
        req: Optional[ApproveCandidateRequest] = None,
    ) -> ApprovedFact:
        """Promote an extracted candidate to an official ApprovedFact."""
        res = await self.db.execute(
            select(FactCandidate).where(
                and_(FactCandidate.org_id == org_id, FactCandidate.id == candidate_id)
            )
        )
        cand = res.scalar_one_or_none()
        if not cand:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Determine source name if source_id is set
        source_name = "Approved Specification"
        if cand.source_id:
            src_res = await self.db.execute(select(Source).where(Source.id == cand.source_id))
            src = src_res.scalar_one_or_none()
            if src:
                source_name = src.source_name

        # Generate unique fact code
        clean_attr = "".join(c for c in cand.attribute.upper() if c.isalnum())[:8] or "SPEC"
        fact_code = (req and req.fact_code) or f"FACT-{clean_attr}-{secrets.token_hex(2).upper()}"
        title = (req and req.title) or f"{cand.entity} {cand.attribute}"
        fact_text = f"{cand.entity} {cand.attribute} is {cand.value_text or cand.value_numeric}"
        if cand.unit:
            fact_text += f" {cand.unit}"
        if cand.qualifier:
            fact_text += f" ({cand.qualifier})"

        # Create approved fact
        fact = ApprovedFact(
            org_id=org_id,
            product_id=cand.product_id,
            fact_code=fact_code,
            title=title,
            fact_text=fact_text,
            entity_name=cand.entity,
            attribute_name=cand.attribute,
            value_text=cand.value_text,
            value_numeric=cand.value_numeric,
            unit=cand.unit,
            qualifier=cand.qualifier,
            source_document_id=cand.source_id,
            source_name=source_name,
            source_excerpt=cand.excerpt,
            source_page_start=cand.source_page,
            verification_status=FactVerificationStatus.APPROVED,
            notes=req.notes if req else None,
            created_by=user_id,
        )
        self.db.add(fact)

        # Mark candidate approved
        now = datetime.now(timezone.utc)
        cand.status = CandidateStatus.APPROVED
        cand.reviewed_by = user_id
        cand.reviewed_at = now

        await self.db.commit()
        await self.db.refresh(fact)

        await self.audit_service.log(
            org_id=org_id,
            user_id=user_id,
            entity_type="approved_fact",
            entity_id=fact.id,
            action="APPROVE_CANDIDATE",
            old_value={"candidate_id": str(cand.id)},
            new_value={"fact_code": fact.fact_code, "title": fact.title},
        )

        return fact

    async def reject_candidate(
        self,
        org_id: UUID,
        user_id: UUID,
        candidate_id: UUID,
    ) -> FactCandidate:
        """Reject and dismiss a fact candidate."""
        res = await self.db.execute(
            select(FactCandidate).where(
                and_(FactCandidate.org_id == org_id, FactCandidate.id == candidate_id)
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

        await self.audit_service.log(
            org_id=org_id,
            user_id=user_id,
            entity_type="fact_candidate",
            entity_id=cand.id,
            action="REJECT",
            old_value={"status": "PENDING"},
            new_value={"status": "REJECTED"},
        )
        return cand
