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
from app.models.consistency import (
    ConsistencyCheckLanguage,
    ConsistencyCheckStatus,
    ConsistencyCheckSubmission,
    ConsistencyCheckJob,
    ConsistencyFinding,
    ConsistencyFindingStatus,
    ApprovedFactSet,
    GlossaryTerm,
    EvaluationCase,
)
from app.models.fact import ApprovedFact
from app.schemas.consistency import (
    ConsistencyCheckSubmissionCreate,
    ConsistencyCheckSubmissionResponse,
    ConsistencyCheckJobResponse,
    ConsistencyCheckJobDetailResponse,
    ConsistencyCheckSubmitResponse,
    ApprovedFactSetCreate,
    ApprovedFactSetUpdate,
    ApprovedFactSetResponse,
    GlossaryTermCreate,
    GlossaryTermUpdate,
    GlossaryTermResponse,
    EvaluationCaseCreate,
    EvaluationCaseResponse,
    ConsistencyFindingResponse,
)
from app.services.consistency import ConsistencyService

router = APIRouter()


# =============================================================================
# Consistency Check Job Endpoints
# =============================================================================

@router.post("", response_model=ConsistencyCheckSubmitResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_consistency_check(
    payload: ConsistencyCheckSubmissionCreate,
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Submit Hindi/Bengali content for consistency checking."""
    service = ConsistencyService(db)
    job = await service.create_check(
        org_id=user.org_id,
        user_id=user.user_id,
        language=payload.language,
        fact_set_id=payload.fact_set_id,
        text=payload.text,
    )
    return ConsistencyCheckSubmitResponse(job_id=job.id, status=job.status)


@router.get("/{job_id}", response_model=ConsistencyCheckJobDetailResponse)
async def get_consistency_check(
    job_id: UUID,
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get status and results of a consistency check job."""
    service = ConsistencyService(db)
    job = await service.get_job(user.org_id, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("", response_model=List[ConsistencyCheckJobResponse])
async def list_consistency_checks(
    status: Optional[ConsistencyCheckStatus] = None,
    language: Optional[str] = None,
    fact_set_id: Optional[UUID] = None,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List consistency check jobs for the organization."""
    service = ConsistencyService(db)
    jobs = await service.list_jobs(
        user.org_id,
        status=status,
        language=language,
        fact_set_id=fact_set_id,
        limit=limit,
        offset=offset,
    )
    return jobs


# =============================================================================
# Finding Decision Endpoints
# =============================================================================

@router.post("/findings/{finding_id}/decisions")
async def record_finding_decision(
    finding_id: UUID,
    decision: ConsistencyFindingStatus,
    note: Optional[str] = None,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Record reviewer decision on a consistency finding."""
    service = ConsistencyService(db)
    finding = await service.record_decision(
        org_id=user.org_id,
        finding_id=finding_id,
        reviewer_id=user.user_id,
        decision=decision,
        note=note,
    )
    return {"success": True, "finding_id": str(finding.id), "status": finding.status}


# =============================================================================
# Approved Fact Set Endpoints
# =============================================================================

@router.get("/fact-sets", response_model=List[ApprovedFactSetResponse])
async def list_fact_sets(
    status: Optional[str] = None,
    product_id: Optional[UUID] = None,
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List approved fact sets."""
    result = await db.execute(
        select(ApprovedFactSet)
        .where(ApprovedFactSet.org_id == user.org_id)
        .order_by(ApprovedFactSet.created_at.desc())
    )
    fact_sets = result.scalars().all()
    
    if status:
        fact_sets = [fs for fs in fact_sets if fs.status == status]
    if product_id:
        fact_sets = [fs for fs in fact_sets if fs.product_id == product_id]
    
    return fact_sets


@router.post("/fact-sets", response_model=ApprovedFactSetResponse, status_code=status.HTTP_201_CREATED)
async def create_fact_set(
    request: ApprovedFactSetCreate,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Create a new approved fact set."""
    fact_set = ApprovedFactSet(
        org_id=user.org_id,
        brand_id=request.brand_id,
        product_id=request.product_id,
        version=request.version,
        status="ACTIVE",
        created_by=user.user_id,
    )
    db.add(fact_set)
    await db.commit()
    await db.refresh(fact_set)
    return fact_set


@router.get("/fact-sets/{fact_set_id}", response_model=ApprovedFactSetResponse)
async def get_fact_set(
    fact_set_id: UUID,
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get a specific fact set."""
    result = await db.execute(
        select(ApprovedFactSet).where(
            ApprovedFactSet.id == fact_set_id,
            ApprovedFactSet.org_id == user.org_id,
        )
    )
    fact_set = result.scalar_one_or_none()
    if not fact_set:
        raise HTTPException(status_code=404, detail="Fact set not found")
    return fact_set


@router.patch("/fact-sets/{fact_set_id}", response_model=ApprovedFactSetResponse)
async def update_fact_set(
    fact_set_id: UUID,
    request: ApprovedFactSetUpdate,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Update a fact set."""
    result = await db.execute(
        select(ApprovedFactSet).where(
            ApprovedFactSet.id == fact_set_id,
            ApprovedFactSet.org_id == user.org_id,
        )
    )
    fact_set = result.scalar_one_or_none()
    if not fact_set:
        raise HTTPException(status_code=404, detail="Fact set not found")
    
    if request.version is not None:
        fact_set.version = request.version
    if request.status is not None:
        fact_set.status = request.status
    if request.brand_id is not None:
        fact_set.brand_id = request.brand_id
    if request.product_id is not None:
        fact_set.product_id = request.product_id
    
    await db.commit()
    await db.refresh(fact_set)
    return fact_set


# =============================================================================
# Glossary Term Endpoints
# =============================================================================

@router.get("/glossary", response_model=List[GlossaryTermResponse])
async def list_glossary_terms(
    category: Optional[str] = None,
    language: Optional[str] = None,
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List glossary terms."""
    query = select(GlossaryTerm).where(GlossaryTerm.org_id == user.org_id)
    if category:
        query = query.where(GlossaryTerm.category == category)
    result = await db.execute(query.order_by(GlossaryTerm.term_en))
    return result.scalars().all()


@router.post("/glossary", response_model=GlossaryTermResponse, status_code=status.HTTP_201_CREATED)
async def create_glossary_term(
    request: GlossaryTermCreate,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Create a new glossary term."""
    term = GlossaryTerm(
        org_id=user.org_id,
        term_en=request.term_en,
        term_hi=request.term_hi,
        term_bn=request.term_bn,
        category=request.category,
        protected=request.protected,
        valid_from=request.valid_from,
        valid_to=request.valid_to,
    )
    db.add(term)
    await db.commit()
    await db.refresh(term)
    return term


@router.patch("/glossary/{term_id}", response_model=GlossaryTermResponse)
async def update_glossary_term(
    term_id: UUID,
    request: GlossaryTermUpdate,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Update a glossary term."""
    result = await db.execute(
        select(GlossaryTerm).where(
            GlossaryTerm.id == term_id,
            GlossaryTerm.org_id == user.org_id,
        )
    )
    term = result.scalar_one_or_none()
    if not term:
        raise HTTPException(status_code=404, detail="Glossary term not found")
    
    if request.term_en is not None:
        term.term_en = request.term_en
    if request.term_hi is not None:
        term.term_hi = request.term_hi
    if request.term_bn is not None:
        term.term_bn = request.term_bn
    if request.category is not None:
        term.category = request.category
    if request.protected is not None:
        term.protected = request.protected
    if request.valid_from is not None:
        term.valid_from = request.valid_from
    if request.valid_to is not None:
        term.valid_to = request.valid_to
    
    await db.commit()
    await db.refresh(term)
    return term


@router.delete("/glossary/{term_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_glossary_term(
    term_id: UUID,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Delete a glossary term."""
    result = await db.execute(
        select(GlossaryTerm).where(
            GlossaryTerm.id == term_id,
            GlossaryTerm.org_id == user.org_id,
        )
    )
    term = result.scalar_one_or_none()
    if not term:
        raise HTTPException(status_code=404, detail="Glossary term not found")
    
    await db.delete(term)
    await db.commit()
    return None


# =============================================================================
# Evaluation Case Endpoints
# =============================================================================

@router.get("/evaluations", response_model=List[EvaluationCaseResponse])
async def list_evaluation_cases(
    language: Optional[str] = None,
    dataset_version: Optional[str] = None,
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List evaluation cases."""
    query = select(EvaluationCase).where(EvaluationCase.org_id == user.org_id)
    if language:
        query = query.where(EvaluationCase.language == language)
    if dataset_version:
        query = query.where(EvaluationCase.dataset_version == dataset_version)
    result = await db.execute(query.order_by(EvaluationCase.created_at.desc()))
    return result.scalars().all()


@router.post("/evaluations", response_model=EvaluationCaseResponse, status_code=status.HTTP_201_CREATED)
async def create_evaluation_case(
    request: EvaluationCaseCreate,
    user: UserContext = Depends(require_reviewer_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Create an evaluation case."""
    case = EvaluationCase(
        org_id=user.org_id,
        language=request.language,
        input_text=request.input_text,
        expected_labels=request.expected_labels,
        dataset_version=request.dataset_version,
    )
    db.add(case)
    await db.commit()
    await db.refresh(case)
    return case
