from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user_flexible, get_db_with_org, require_creator_or_above
from app.models.content import (
    ContentItem,
    ContentVersion,
    ContentStatus,
    ContentType,
    Channel,
    RiskLevel,
)
from app.models.analysis import AnalysisRun
from app.models.finding import Finding
from app.models.claim import Claim
from app.models.review import ReviewDecision
from app.schemas.content import (
    ContentCreate,
    ContentUpdate,
    ContentResponse,
    ContentDetailResponse,
    ContentVersionResponse,
)
from app.schemas.analysis import (
    AnalysisTriggerResponse,
    AnalysisStatusResponse,
    AnalysisRunResponse,
    ClaimResponse,
    FindingResponse,
)
from app.schemas.review import ReviewDecisionResponse
from app.services.submissions import create_submission, get_submission_with_details
from app.services.verification import VerificationEngine
from app.services.audit import AuditService
from app.tasks.analysis import analyze_content_task
import structlog

logger = structlog.get_logger()

router = APIRouter()


@router.get("", response_model=List[ContentResponse])
async def list_content(
    status_filter: Optional[ContentStatus] = None,
    risk_filter: Optional[RiskLevel] = None,
    limit: int = 50,
    offset: int = 0,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List content submissions."""
    query = select(ContentItem).where(ContentItem.org_id == user.org_id)
    if status_filter:
        query = query.where(ContentItem.status == status_filter)
    if risk_filter:
        query = query.where(ContentItem.risk_level == risk_filter)
    query = query.order_by(ContentItem.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    content_items = result.scalars().all()
    return [ContentResponse.model_validate(c) for c in content_items]


@router.post("", response_model=ContentResponse, status_code=status.HTTP_201_CREATED)
async def create_content(
    request: ContentCreate,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Create a new content submission."""
    import hashlib
    content_hash = hashlib.sha256(request.original_content.encode()).hexdigest()

    content = ContentItem(
        org_id=user.org_id,
        title=request.title,
        content_type=request.content_type,
        channel=request.channel,
        original_content=request.original_content,
        current_content=request.original_content,
        content_hash=content_hash,
        status=ContentStatus.DRAFT,
        product_context=request.product_context,
        campaign_context=request.campaign_context,
        locale=request.locale,
        created_by=user.user_id,
    )
    db.add(content)
    await db.flush()

    # Create initial version
    version = ContentVersion(
        org_id=user.org_id,
        content_id=content.id,
        version_number=1,
        content=request.original_content,
        change_reason="Initial submission",
        created_by=user.user_id,
    )
    db.add(version)
    await db.commit()
    await db.refresh(content)

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="content_submission",
        entity_id=content.id,
        action="CREATE",
        old_value=None,
        new_value={
            "title": content.title,
            "content_type": content.content_type.value,
            "channel": content.channel.value,
        },
    )

    return ContentResponse.model_validate(content)


@router.get("/{content_id}", response_model=ContentDetailResponse)
async def get_content(
    content_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get content with all details (versions, runs, claims, findings, decisions)."""
    result = await db.execute(
        select(ContentItem)
        .where(ContentItem.id == content_id, ContentItem.org_id == user.org_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    # Get versions
    versions_result = await db.execute(
        select(ContentVersion)
        .where(ContentVersion.content_id == content_id)
        .order_by(ContentVersion.version_number)
    )
    versions = versions_result.scalars().all()

    # Get analysis runs
    runs_result = await db.execute(
        select(AnalysisRun)
        .where(AnalysisRun.content_id == content_id)
        .order_by(AnalysisRun.started_at.desc())
    )
    runs = runs_result.scalars().all()

    # Get claims
    claims_result = await db.execute(
        select(Claim)
        .where(Claim.content_id == content_id)
        .order_by(Claim.created_at)
    )
    claims = claims_result.scalars().all()

    # Get findings
    findings_result = await db.execute(
        select(Finding)
        .where(Finding.content_id == content_id)
        .order_by(Finding.created_at)
    )
    findings = findings_result.scalars().all()

    # Get review decisions
    decisions_result = await db.execute(
        select(ReviewDecision)
        .where(ReviewDecision.content_id == content_id)
        .order_by(ReviewDecision.created_at)
    )
    decisions = decisions_result.scalars().all()

    response = ContentDetailResponse.model_validate(content)
    response.versions = [ContentVersionResponse.model_validate(v) for v in versions]
    response.runs = [AnalysisRunResponse.model_validate(r) for r in runs]
    response.claims = [ClaimResponse.model_validate(c) for c in claims]
    response.findings = [FindingResponse.model_validate(f) for f in findings]
    response.decisions = [ReviewDecisionResponse.model_validate(d) for d in decisions]

    return response


@router.patch("/{content_id}", response_model=ContentResponse)
async def update_content(
    content_id: UUID,
    request: ContentUpdate,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Update content submission."""
    result = await db.execute(
        select(ContentItem)
        .where(ContentItem.id == content_id, ContentItem.org_id == user.org_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    old_values = {
        "title": content.title,
        "current_content": content.current_content,
        "status": content.status.value,
    }

    update_data = request.model_dump(exclude_unset=True)
    
    # If content changed, create new version
    if "current_content" in update_data and update_data["current_content"] != content.current_content:
        import hashlib
        content.content_hash = hashlib.sha256(update_data["current_content"].encode()).hexdigest()
        
        # Get latest version number
        version_result = await db.execute(
            select(func.max(ContentVersion.version_number))
            .where(ContentVersion.content_id == content_id)
        )
        max_version = version_result.scalar() or 0
        
        version = ContentVersion(
            org_id=user.org_id,
            content_id=content_id,
            version_number=max_version + 1,
            content=update_data["current_content"],
            change_reason=update_data.get("change_reason", "Content updated"),
            created_by=user.user_id,
        )
        db.add(version)

    for field, value in update_data.items():
        setattr(content, field, value)

    await db.commit()
    await db.refresh(content)

    new_values = {
        "title": content.title,
        "current_content": content.current_content,
        "status": content.status.value,
    }

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="content_submission",
        entity_id=content.id,
        action="UPDATE",
        old_value=old_values,
        new_value=new_values,
    )

    return ContentResponse.model_validate(content)


@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Delete content submission."""
    result = await db.execute(
        select(ContentItem)
        .where(ContentItem.id == content_id, ContentItem.org_id == user.org_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    await db.delete(content)
    await db.commit()

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="content_submission",
        entity_id=content.id,
        action="DELETE",
        old_value={"title": content.title},
        new_value=None,
    )


@router.post("/{content_id}/analyze", response_model=AnalysisTriggerResponse)
async def analyze_content(
    content_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Trigger content analysis (async)."""
    result = await db.execute(
        select(ContentItem)
        .where(ContentItem.id == content_id, ContentItem.org_id == user.org_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    if content.status == ContentStatus.ANALYZING:
        raise HTTPException(status_code=400, detail="Analysis already in progress")

    # Update status to analyzing
    content.status = ContentStatus.ANALYZING
    await db.commit()

    # Queue async task
    task = analyze_content_task.delay(
        str(content_id),
        str(user.org_id),
        str(user.user_id),
    )

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="content_submission",
        entity_id=content.id,
        action="ANALYZE_START",
        old_value={"status": "DRAFT"},
        new_value={"status": "ANALYZING", "task_id": task.id},
    )

    return AnalysisTriggerResponse(task_id=task.id, content_id=content_id)


@router.get("/{content_id}/status", response_model=AnalysisStatusResponse)
async def get_analysis_status(
    content_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get analysis status."""
    result = await db.execute(
        select(ContentItem)
        .where(ContentItem.id == content_id, ContentItem.org_id == user.org_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    # Get latest run
    run_result = await db.execute(
        select(AnalysisRun)
        .where(AnalysisRun.content_id == content_id)
        .order_by(AnalysisRun.started_at.desc())
        .limit(1)
    )
    run = run_result.scalar_one_or_none()

    if not run:
        return AnalysisStatusResponse(
            status=AnalysisStatus.PENDING,
            progress=0,
        )

    # Count findings and claims
    findings_count = 0
    claims_count = 0
    if run.status == AnalysisStatus.COMPLETED:
        from app.models.finding import Finding
        from app.models.claim import Claim
        fc = await db.execute(
            select(func.count(Finding.id)).where(Finding.analysis_run_id == run.id)
        )
        findings_count = fc.scalar() or 0
        cc = await db.execute(
            select(func.count(Claim.id)).where(Claim.analysis_run_id == run.id)
        )
        claims_count = cc.scalar() or 0

    return AnalysisStatusResponse(
        status=run.status,
        progress=100 if run.status in [AnalysisStatus.COMPLETED, AnalysisStatus.FAILED] else 50,
        findings_count=findings_count,
        claims_count=claims_count,
        error=run.error_message,
    )


@router.get("/{content_id}/findings", response_model=List[FindingResponse])
async def get_findings(
    content_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get all findings for content."""
    result = await db.execute(
        select(ContentItem)
        .where(ContentItem.id == content_id, ContentItem.org_id == user.org_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    findings_result = await db.execute(
        select(Finding)
        .where(Finding.content_id == content_id)
        .order_by(Finding.created_at)
    )
    findings = findings_result.scalars().all()
    return [FindingResponse.model_validate(f) for f in findings]


@router.get("/{content_id}/claims", response_model=List[ClaimResponse])
async def get_claims(
    content_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get all claims for content."""
    result = await db.execute(
        select(ContentItem)
        .where(ContentItem.id == content_id, ContentItem.org_id == user.org_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    claims_result = await db.execute(
        select(Claim)
        .where(Claim.content_id == content_id)
        .order_by(Claim.created_at)
    )
    claims = claims_result.scalars().all()
    return [ClaimResponse.model_validate(c) for c in claims]


@router.get("/{content_id}/runs", response_model=List[AnalysisRunResponse])
async def get_runs(
    content_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get all analysis runs for content."""
    result = await db.execute(
        select(ContentItem)
        .where(ContentItem.id == content_id, ContentItem.org_id == user.org_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    runs_result = await db.execute(
        select(AnalysisRun)
        .where(AnalysisRun.content_id == content_id)
        .order_by(AnalysisRun.started_at.desc())
    )
    runs = runs_result.scalars().all()
    return [AnalysisRunResponse.model_validate(r) for r in runs]
