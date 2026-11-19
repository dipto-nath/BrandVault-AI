from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.dependencies import (
    get_current_user_flexible,
    get_db_with_org,
    require_reviewer_or_admin,
    require_admin,
    UserContext,
)
from app.models.guideline import BrandGuideline, GuidelineCategory, Severity
from app.models.fact_candidate import CandidateStatus
from app.schemas.guideline import (
    BrandGuidelineCreate,
    BrandGuidelineUpdate,
    BrandGuidelineResponse,
)
from app.schemas.guideline_template import (
    GuidelineTemplateResponse,
    CloneTemplatesRequest,
    GuidelineCandidateCreate,
    GuidelineCandidateResponse,
)
from app.services.guidelines import GuidelineService

router = APIRouter()


@router.get("", response_model=List[BrandGuidelineResponse])
async def list_guidelines(
    active_only: bool = False,
    category: Optional[GuidelineCategory] = None,
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List all brand guidelines."""
    service = GuidelineService(db)
    guidelines = await service.list_guidelines(user.org_id, active_only=active_only, category=category)
    return [BrandGuidelineResponse.model_validate(g) for g in guidelines]


@router.post("", response_model=BrandGuidelineResponse, status_code=status.HTTP_201_CREATED)
async def create_guideline(
    request: BrandGuidelineCreate,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Create a new brand guideline (Reviewer or Admin)."""
    service = GuidelineService(db)
    guideline = await service.create_guideline(user.org_id, user.user_id, request)
    return BrandGuidelineResponse.model_validate(guideline)


# =============================================================================
# Starter Template Library & 1-Click Clone
# =============================================================================

@router.get("/templates", response_model=List[GuidelineTemplateResponse])
async def list_templates(
    industry: Optional[str] = Query(None),
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List pre-built starter guideline templates by industry."""
    service = GuidelineService(db)
    templates = await service.list_templates(industry=industry)
    return [GuidelineTemplateResponse.model_validate(t) for t in templates]


@router.post("/templates/clone", response_model=List[BrandGuidelineResponse])
async def clone_templates(
    request: CloneTemplatesRequest,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Clone selected starter templates into the workspace."""
    service = GuidelineService(db)
    cloned = await service.clone_templates(user.org_id, user.user_id, request.template_ids)
    return [BrandGuidelineResponse.model_validate(g) for g in cloned]


# =============================================================================
# Guideline Candidates Queue
# =============================================================================

@router.get("/candidates", response_model=List[GuidelineCandidateResponse])
async def list_candidates(
    status: Optional[CandidateStatus] = Query(None),
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List pending guideline candidates."""
    service = GuidelineService(db)
    cands = await service.list_candidates(user.org_id, status_filter=status)
    return [GuidelineCandidateResponse.model_validate(c) for c in cands]


@router.post("/candidates", response_model=GuidelineCandidateResponse, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    request: GuidelineCandidateCreate,
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Create a guideline candidate from extraction or review notes."""
    service = GuidelineService(db)
    cand = await service.create_candidate(user.org_id, request)
    return GuidelineCandidateResponse.model_validate(cand)


@router.post("/candidates/{candidate_id}/approve", response_model=BrandGuidelineResponse)
async def approve_candidate(
    candidate_id: UUID,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Approve a guideline candidate into active brand guidelines."""
    service = GuidelineService(db)
    guideline = await service.approve_candidate(user.org_id, user.user_id, candidate_id)
    return BrandGuidelineResponse.model_validate(guideline)


@router.post("/candidates/{candidate_id}/reject", response_model=GuidelineCandidateResponse)
async def reject_candidate(
    candidate_id: UUID,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Reject and dismiss a guideline candidate."""
    service = GuidelineService(db)
    cand = await service.reject_candidate(user.org_id, user.user_id, candidate_id)
    return GuidelineCandidateResponse.model_validate(cand)


# =============================================================================
# Specific Guideline Item Operations
# =============================================================================

@router.get("/{guideline_id}", response_model=BrandGuidelineResponse)
async def get_guideline(
    guideline_id: UUID,
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get a specific guideline."""
    service = GuidelineService(db)
    guideline = await service.get_guideline(guideline_id, user.org_id)
    return BrandGuidelineResponse.model_validate(guideline)


@router.patch("/{guideline_id}", response_model=BrandGuidelineResponse)
async def update_guideline(
    guideline_id: UUID,
    request: BrandGuidelineUpdate,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Update a brand guideline."""
    service = GuidelineService(db)
    guideline = await service.update_guideline(guideline_id, user.org_id, request, user_id=user.user_id)
    return BrandGuidelineResponse.model_validate(guideline)


@router.post("/{guideline_id}/deactivate", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_guideline(
    guideline_id: UUID,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Deactivate a guideline."""
    service = GuidelineService(db)
    await service.deactivate_guideline(guideline_id, user.org_id, user_id=user.user_id)
    return None
