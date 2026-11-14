from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user_flexible, get_db_with_org, require_reviewer_or_admin
from app.models.content import ContentItem, ContentStatus
from app.models.finding import Finding
from app.models.review import ReviewDecision, FindingFeedback, ReviewDecision as ReviewDecisionEnum, FeedbackType
from app.schemas.review import (
    FindingDecisionRequest,
    ContentDecisionRequest,
    ReviewQueueItem,
    ReviewDecisionResponse,
    FindingFeedbackCreate,
    FindingFeedbackResponse,
)
from app.schemas.content import ContentResponse
from app.schemas.finding import FindingResponse
from app.services.audit import AuditService

router = APIRouter()


@router.get("/queue", response_model=List[ReviewQueueItem])
async def get_review_queue(
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get review queue for reviewer/admin."""
    # Get content needing review
    result = await db.execute(
        select(ContentItem)
        .where(
            ContentItem.org_id == user.org_id,
            ContentItem.status.in_([ContentStatus.NEEDS_REVIEW, ContentStatus.CHANGES_REQUESTED]),
        )
        .order_by(ContentItem.submitted_at.asc().nulls_last())
    )
    content_items = result.scalars().all()

    queue = []
    for content in content_items:
        # Count findings
        findings_result = await db.execute(
            select(func.count(Finding.id))
            .where(Finding.content_id == content.id)
        )
        findings_count = findings_result.scalar() or 0

        # Count high severity
        high_result = await db.execute(
            select(func.count(Finding.id))
            .where(
                Finding.content_id == content.id,
                Finding.severity.in_(["HIGH"]),
            )
        )
        high_count = high_result.scalar() or 0

        # Get oldest finding
        oldest_result = await db.execute(
            select(Finding.created_at)
            .where(Finding.content_id == content.id)
            .order_by(Finding.created_at.asc())
            .limit(1)
        )
        oldest = oldest_result.scalar_one_or_none()

        queue.append(ReviewQueueItem(
            content=ContentResponse.model_validate(content),
            findings_count=findings_count,
            high_severity_count=high_count,
            oldest_finding_at=oldest or content.created_at,
        ))

    return queue


@router.get("/{content_id}")
async def get_review_detail(
    content_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get full review detail for content."""
    from app.models.content import ContentItem
    from app.models.analysis import AnalysisRun
    from app.models.claim import Claim
    from app.models.finding import Finding
    from app.models.review import ReviewDecision as ReviewDecisionModel

    result = await db.execute(
        select(ContentItem)
        .where(ContentItem.id == content_id, ContentItem.org_id == user.org_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    # Get findings
    findings_result = await db.execute(
        select(Finding)
        .where(Finding.content_id == content_id)
        .order_by(Finding.created_at)
    )
    findings = findings_result.scalars().all()

    # Get claims
    claims_result = await db.execute(
        select(Claim)
        .where(Claim.content_id == content_id)
        .order_by(Claim.created_at)
    )
    claims = claims_result.scalars().all()

    # Get decisions
    decisions_result = await db.execute(
        select(ReviewDecisionModel)
        .where(ReviewDecisionModel.content_id == content_id)
        .order_by(ReviewDecisionModel.created_at)
    )
    decisions = decisions_result.scalars().all()

    return {
        "content": ContentResponse.model_validate(content),
        "findings": [FindingResponse.model_validate(f) for f in findings],
        "claims": [ClaimResponse.model_validate(c) for c in claims],
        "decisions": [ReviewDecisionResponse.model_validate(d) for d in decisions],
    }

from app.schemas.analysis import ClaimResponse, FindingResponse


@router.post("/{finding_id}/decide", response_model=FindingResponse)
async def decide_finding(
    finding_id: UUID,
    request: FindingDecisionRequest,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Decide on a specific finding (approve/reject/override)."""
    result = await db.execute(
        select(Finding)
        .where(Finding.id == finding_id, Finding.org_id == user.org_id)
    )
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    # Require reason for critical findings
    critical_types = ["FACTUAL_CONTRADICTION", "OUTDATED_SOURCE", "CONFLICTING_SOURCES"]
    if finding.finding_type.value in critical_types and request.decision != ReviewDecisionEnum.APPROVED:
        if not request.reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reason required for overriding critical findings",
            )

    from datetime import datetime, timezone
    finding.status = "RESOLVED" if request.decision == ReviewDecisionEnum.APPROVED else "OVERRIDDEN"
    finding.resolved_by = user.user_id
    finding.resolved_at = datetime.now(timezone.utc)
    finding.override_reason = request.reason

    # Create feedback record
    feedback = FindingFeedback(
        org_id=user.org_id,
        finding_id=finding.id,
        user_id=user.user_id,
        feedback_type=FeedbackType.OVERRIDDEN if request.decision != ReviewDecisionEnum.APPROVED else FeedbackType.ACCEPTED,
        reason=request.reason,
    )
    db.add(feedback)

    # Check if all findings resolved
    from app.models.content import ContentStatus
    all_findings = await db.execute(
        select(Finding).where(Finding.content_id == finding.content_id)
    )
    all_resolved = all(f.status in ["RESOLVED", "OVERRIDDEN"] for f in all_findings.scalars().all())
    
    if all_resolved:
        content_result = await db.execute(
            select(ContentItem).where(ContentItem.id == finding.content_id)
        )
        content = content_result.scalar_one_or_none()
        if content:
            content.status = ContentStatus.APPROVED
            content.approved_at = datetime.now(timezone.utc)
            content.reviewer_id = user.user_id

    await db.commit()
    await db.refresh(finding)

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="finding",
        entity_id=finding.id,
        action="DECIDE",
        old_value={"status": "OPEN"},
        new_value={"status": finding.status, "decision": request.decision.value, "reason": request.reason},
    )

    return FindingResponse.model_validate(finding)


@router.post("/{content_id}/decide", response_model=ContentResponse)
async def decide_content(
    content_id: UUID,
    request: ContentDecisionRequest,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Bulk decide on content with all findings."""
    from app.models.content import ContentItem, ContentStatus
    from app.models.finding import Finding
    from datetime import datetime, timezone

    result = await db.execute(
        select(ContentItem)
        .where(ContentItem.id == content_id, ContentItem.org_id == user.org_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    # Process finding decisions
    for fd in request.finding_decisions:
        finding_result = await db.execute(
            select(Finding).where(Finding.id == fd.finding_id, Finding.org_id == user.org_id)
        )
        finding = finding_result.scalar_one_or_none()
        if finding:
            finding.status = "RESOLVED" if fd.decision == ReviewDecisionEnum.APPROVED else "OVERRIDDEN"
            finding.resolved_by = user.user_id
            finding.resolved_at = datetime.now(timezone.utc)
            finding.override_reason = fd.reason

            feedback = FindingFeedback(
                org_id=user.org_id,
                finding_id=finding.id,
                user_id=user.user_id,
                feedback_type=FeedbackType.OVERRIDDEN if fd.decision != ReviewDecisionEnum.APPROVED else FeedbackType.ACCEPTED,
                reason=fd.reason,
            )
            db.add(feedback)

    # Update content status
    if request.decision == ReviewDecisionEnum.APPROVED:
        content.status = ContentStatus.APPROVED
        content.approved_at = datetime.now(timezone.utc)
    elif request.decision == ContentStatus.REJECTED:
        content.status = ContentStatus.REJECTED
        content.rejected_at = datetime.now(timezone.utc)
    else:
        content.status = ContentStatus.CHANGES_REQUESTED

    content.reviewer_id = user.user_id

    # Create review decision record
    review_decision = ReviewDecision(
        org_id=user.org_id,
        content_id=content_id,
        reviewer_id=user.user_id,
        decision=request.decision,
        comment=request.comment,
    )
    db.add(review_decision)

    await db.commit()
    await db.refresh(content)

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="content_submission",
        entity_id=content.id,
        action="DECIDE",
        old_value={"status": content.status.value},
        new_value={"decision": request.decision.value, "comment": request.comment},
    )

    return ContentResponse.model_validate(content)


@router.get("/{content_id}/feedback/{finding_id}", response_model=List[FindingFeedbackResponse])
async def get_finding_feedback(
    content_id: UUID,
    finding_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get feedback for a finding."""
    result = await db.execute(
        select(FindingFeedback)
        .where(FindingFeedback.finding_id == finding_id, FindingFeedback.org_id == user.org_id)
        .order_by(FindingFeedback.created_at)
    )
    feedback = result.scalars().all()
    return [FindingFeedbackResponse.model_validate(f) for f in feedback]


@router.post("/{content_id}/feedback/{finding_id}", response_model=FindingFeedbackResponse)
async def add_finding_feedback(
    content_id: UUID,
    finding_id: UUID,
    request: FindingFeedbackCreate,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Add feedback to a finding."""
    finding_result = await db.execute(
        select(Finding).where(Finding.id == finding_id, Finding.org_id == user.org_id)
    )
    finding = finding_result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    feedback = FindingFeedback(
        org_id=user.org_id,
        finding_id=finding_id,
        user_id=user.user_id,
        feedback_type=request.feedback_type,
        reason=request.reason,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)

    return FindingFeedbackResponse.model_validate(feedback)
