from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user_flexible, get_db_with_org, require_admin
from app.models.content import ContentItem
from app.models.finding import Finding
from app.models.review import FindingFeedback, FeedbackType
from app.models.suggestion import GuidelineSuggestion, SuggestionStatus
from app.models.guideline import BrandGuideline
from app.schemas.insights import (
    InsightsResponse,
    GuidelineSuggestionResponse,
    GuidelineSuggestionCreate,
)
from app.services.audit import AuditService

router = APIRouter()


@router.get("", response_model=InsightsResponse)
async def get_insights(
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get governance insights."""
    # Submission stats
    total_result = await db.execute(
        select(func.count(ContentItem.id)).where(ContentItem.org_id == user.org_id)
    )
    total = total_result.scalar() or 0

    status_result = await db.execute(
        select(ContentItem.status, func.count(ContentItem.id))
        .where(ContentItem.org_id == user.org_id)
        .group_by(ContentItem.status)
    )
    status_counts = {row[0].value: row[1] for row in status_result.all()}

    risk_result = await db.execute(
        select(ContentItem.risk_level, func.count(ContentItem.id))
        .where(ContentItem.org_id == user.org_id)
        .group_by(ContentItem.risk_level)
    )
    risk_counts = {row[0].value if row[0] else None: row[1] for row in risk_result.all()}

    # Feedback stats
    feedback_result = await db.execute(
        select(FindingFeedback.feedback_type, func.count(FindingFeedback.id))
        .join(Finding, FindingFeedback.finding_id == Finding.id)
        .where(Finding.org_id == user.org_id)
        .group_by(FindingFeedback.feedback_type)
    )
    feedback_counts = {row[0].value: row[1] for row in feedback_result.all()}
    total_feedback = sum(feedback_counts.values())

    # Top override reasons
    reason_result = await db.execute(
        select(FindingFeedback.reason, func.count(FindingFeedback.id))
        .join(Finding, FindingFeedback.finding_id == Finding.id)
        .where(Finding.org_id == user.org_id)
        .where(FindingFeedback.reason.isnot(None))
        .group_by(FindingFeedback.reason)
        .order_by(func.count(FindingFeedback.id).desc())
        .limit(5)
    )
    top_reasons = [
        {"reason": row[0], "count": row[1]}
        for row in reason_result.all()
    ]

    # Frequently overridden findings
    override_result = await db.execute(
        select(Finding.id, Finding.finding_type, Finding.title, func.count(FindingFeedback.id))
        .join(FindingFeedback, FindingFeedback.finding_id == Finding.id)
        .where(Finding.org_id == user.org_id)
        .group_by(Finding.id, Finding.finding_type, Finding.title)
        .order_by(func.count(FindingFeedback.id).desc())
        .limit(5)
    )
    frequently_overridden = [
        {"finding_id": str(row[0]), "finding_type": row[1].value, "title": row[2], "count": row[3]}
        for row in override_result.all()
    ]

    # Guideline suggestions
    suggestions_result = await db.execute(
        select(GuidelineSuggestion)
        .where(GuidelineSuggestion.org_id == user.org_id)
        .order_by(GuidelineSuggestion.created_at.desc())
    )
    suggestions = suggestions_result.scalars().all()

    return InsightsResponse(
        total_submissions=total,
        approved=status_counts.get("APPROVED", 0),
        rejected=status_counts.get("REJECTED", 0),
        pending=status_counts.get("NEEDS_REVIEW", 0) + status_counts.get("CHANGES_REQUESTED", 0),
        high_risk=risk_counts.get("HIGH", 0),
        total_feedback=total_feedback,
        top_reasons=top_reasons,
        frequently_overridden=frequently_overridden,
        suggestions=[GuidelineSuggestionResponse.model_validate(s) for s in suggestions],
    )


@router.get("/guideline-suggestions", response_model=List[GuidelineSuggestionResponse])
async def list_guideline_suggestions(
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List all guideline suggestions."""
    result = await db.execute(
        select(GuidelineSuggestion)
        .where(GuidelineSuggestion.org_id == user.org_id)
        .order_by(GuidelineSuggestion.created_at.desc())
    )
    suggestions = result.scalars().all()
    return [GuidelineSuggestionResponse.model_validate(s) for s in suggestions]


@router.post("/guideline-suggestions", response_model=GuidelineSuggestionResponse, status_code=201)
async def create_guideline_suggestion(
    request: GuidelineSuggestionCreate,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Create a new guideline suggestion."""
    # Verify guideline exists
    from app.models.guideline import BrandGuideline
    guideline_result = await db.execute(
        select(BrandGuideline).where(
            BrandGuideline.id == request.guideline_id,
            BrandGuideline.org_id == user.org_id,
        )
    )
    if not guideline_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Guideline not found")

    suggestion = GuidelineSuggestion(
        org_id=user.org_id,
        **request.model_dump(),
        created_by=user.user_id,
    )
    db.add(suggestion)
    await db.commit()
    await db.refresh(suggestion)

    return GuidelineSuggestionResponse.model_validate(suggestion)


@router.post("/guideline-suggestions/{suggestion_id}/approve", status_code=204)
async def approve_guideline_suggestion(
    suggestion_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Approve a guideline suggestion (ADMIN only)."""
    result = await db.execute(
        select(GuidelineSuggestion)
        .where(GuidelineSuggestion.id == suggestion_id, GuidelineSuggestion.org_id == user.org_id)
    )
    suggestion = result.scalar_one_or_none()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    from datetime import datetime, timezone
    suggestion.status = SuggestionStatus.APPROVED
    suggestion.reviewed_by = user.user_id
    suggestion.reviewed_at = datetime.now(timezone.utc)
    await db.commit()

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="guideline_suggestion",
        entity_id=suggestion.id,
        action="APPROVE",
        old_value={"status": "PENDING"},
        new_value={"status": "APPROVED"},
    )


@router.post("/guideline-suggestions/{suggestion_id}/reject", status_code=204)
async def reject_guideline_suggestion(
    suggestion_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Reject a guideline suggestion (ADMIN only)."""
    result = await db.execute(
        select(GuidelineSuggestion)
        .where(GuidelineSuggestion.id == suggestion_id, GuidelineSuggestion.org_id == user.org_id)
    )
    suggestion = result.scalar_one_or_none()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    from datetime import datetime, timezone
    suggestion.status = SuggestionStatus.REJECTED
    suggestion.reviewed_by = user.user_id
    suggestion.reviewed_at = datetime.now(timezone.utc)
    await db.commit()

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="guideline_suggestion",
        entity_id=suggestion.id,
        action="REJECT",
        old_value={"status": "PENDING"},
        new_value={"status": "REJECTED"},
    )
