from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.dependencies import (
    get_current_user_flexible,
    get_db_with_org,
    require_reviewer_or_admin,
    UserContext,
)
from app.models.fact import ApprovedFact, FactVerificationStatus
from app.models.fact_candidate import CandidateStatus
from app.schemas.fact import (
    ApprovedFactCreate,
    ApprovedFactUpdate,
    ApprovedFactResponse,
)
from app.schemas.fact_candidate import (
    FactCandidateCreate,
    FactCandidateUpdate,
    FactCandidateResponse,
    ApproveCandidateRequest,
)
from app.services.facts import FactService

router = APIRouter()


@router.get("", response_model=List[ApprovedFactResponse])
async def list_facts(
    active_only: bool = True,
    product_id: Optional[UUID] = Query(None),
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List approved facts, with optional product and status filtering."""
    service = FactService(db)
    facts = await service.list_facts(user.org_id, active_only=active_only, product_id=product_id)
    return [ApprovedFactResponse.model_validate(f) for f in facts]


@router.post("", response_model=ApprovedFactResponse, status_code=status.HTTP_201_CREATED)
async def create_fact(
    request: ApprovedFactCreate,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Create a new approved fact (Reviewer or Admin)."""
    service = FactService(db)
    fact = await service.create_fact(user.org_id, user.user_id, request)
    return ApprovedFactResponse.model_validate(fact)


# =============================================================================
# Candidate Ground Truth Endpoints
# =============================================================================

@router.get("/candidates", response_model=List[FactCandidateResponse])
async def list_candidates(
    product_id: Optional[UUID] = Query(None),
    status: Optional[CandidateStatus] = Query(None),
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List pending or reviewed fact candidates."""
    service = FactService(db)
    cands = await service.list_candidates(user.org_id, product_id=product_id, status_filter=status)
    return [FactCandidateResponse.model_validate(c) for c in cands]


@router.post("/candidates", response_model=FactCandidateResponse, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    request: FactCandidateCreate,
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Submit a fact candidate for review (e.g. from document ingestion)."""
    service = FactService(db)
    cand = await service.create_candidate(user.org_id, request)
    return FactCandidateResponse.model_validate(cand)


@router.patch("/candidates/{candidate_id}", response_model=FactCandidateResponse)
async def update_candidate(
    candidate_id: UUID,
    request: FactCandidateUpdate,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Edit candidate details before approving."""
    service = FactService(db)
    cand = await service.update_candidate(user.org_id, candidate_id, request)
    return FactCandidateResponse.model_validate(cand)


@router.post("/candidates/{candidate_id}/approve", response_model=ApprovedFactResponse)
async def approve_candidate(
    candidate_id: UUID,
    request: Optional[ApproveCandidateRequest] = None,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Promote an extracted candidate to an official ApprovedFact."""
    service = FactService(db)
    fact = await service.approve_candidate(user.org_id, user.user_id, candidate_id, request)
    return ApprovedFactResponse.model_validate(fact)


@router.post("/candidates/{candidate_id}/reject", response_model=FactCandidateResponse)
async def reject_candidate(
    candidate_id: UUID,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Reject and dismiss a fact candidate."""
    service = FactService(db)
    cand = await service.reject_candidate(user.org_id, user.user_id, candidate_id)
    return FactCandidateResponse.model_validate(cand)


# =============================================================================
# Specific Fact Item Operations
# =============================================================================

@router.get("/{fact_id}", response_model=ApprovedFactResponse)
async def get_fact(
    fact_id: UUID,
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get a specific fact."""
    result = await db.execute(
        select(ApprovedFact).where(
            ApprovedFact.id == fact_id,
            ApprovedFact.org_id == user.org_id,
        )
    )
    fact = result.scalar_one_or_none()
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")
    return ApprovedFactResponse.model_validate(fact)


@router.patch("/{fact_id}", response_model=ApprovedFactResponse)
async def update_fact(
    fact_id: UUID,
    request: ApprovedFactUpdate,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Update an approved fact."""
    service = FactService(db)
    fact = await service.update_fact(fact_id, user.org_id, request, user_id=user.user_id)
    return ApprovedFactResponse.model_validate(fact)


@router.delete("/{fact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fact(
    fact_id: UUID,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Delete an approved fact."""
    result = await db.execute(
        select(ApprovedFact).where(
            ApprovedFact.id == fact_id,
            ApprovedFact.org_id == user.org_id,
        )
    )
    fact = result.scalar_one_or_none()
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")

    fact_code = fact.fact_code
    await db.delete(fact)
    await db.commit()

    service = FactService(db)
    await service.audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="approved_fact",
        entity_id=fact_id,
        action="DELETE",
        old_value={"fact_code": fact_code},
        new_value=None,
    )
    return None
