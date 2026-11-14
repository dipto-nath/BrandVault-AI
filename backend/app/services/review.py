from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import List, Optional
from datetime import datetime, timezone

from app.models.content import ContentItem, ContentStatus
from app.models.finding import Finding
from app.models.review import ReviewDecision, FindingFeedback, ReviewDecision as ReviewDecisionEnum, FeedbackType
from app.schemas.review import (
    FindingDecisionRequest,
    ContentDecisionRequest,
    ReviewQueueItem,
    FindingFeedbackCreate,
)
from app.schemas.content import ContentResponse
from app.schemas.finding import FindingResponse
from app.services.audit import AuditService


class ReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_review_queue(
        self,
        org_id: UUID,
        user_id: UUID,
    ) -> List[ReviewQueueItem]:
        """Get review queue for reviewer/admin."""
        result = await self.db.execute(
            select(ContentItem)
            .where(
                ContentItem.org_id == org_id,
                ContentItem.status.in_([ContentStatus.NEEDS_REVIEW, ContentStatus.CHANGES_REQUESTED]),
            )
            .order_by(ContentItem.submitted_at.asc().nulls_last())
        )
        content_items = result.scalars().all()

        queue = []
        for content in content_items:
            findings_result = await self.db.execute(
                select(func.count(Finding.id))
                .where(Finding.content_id == content.id)
            )
            findings_count = findings_result.scalar() or 0

            high_result = await self.db.execute(
                select(func.count(Finding.id))
                .where(
                    Finding.content_id == content.id,
                    Finding.severity == "HIGH",
                )
            )
            high_count = high_result.scalar() or 0

            oldest_result = await self.db.execute(
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

    async def get_review_detail(
        self,
        content_id: UUID,
        org_id: UUID,
    ) -> dict:
        """Get full review detail for content."""
        from app.models.analysis import Claim
        from app.models.finding import Finding
        from app.models.review import ReviewDecision as ReviewDecisionModel

        content_result = await self.db.execute(
            select(ContentItem)
            .where(ContentItem.id == content_id, ContentItem.org_id == org_id)
        )
        content = content_result.scalar_one_or_none()
        if not content:
            raise ValueError("Content not found")

        findings_result = await self.db.execute(
            select(Finding)
            .where(Finding.content_id == content_id)
            .order_by(Finding.created_at)
        )
        findings = findings_result.scalars().all()

        claims_result = await self.db.execute(
            select(Claim)
            .where(Claim.content_id == content_id)
            .order_by(Claim.created_at)
        )
        claims = claims_result.scalars().all()

        decisions_result = await self.db.execute(
            select(ReviewDecisionModel)
            .where(ReviewDecisionModel.content_id == content_id)
            .order_by(ReviewDecisionModel.created_at)
        )
        decisions = decisions_result.scalars().all()

        return {
            "content": ContentResponse.model_validate(content),
            "findings": [FindingResponse.model_validate(f) for f in findings],
            "claims": claims,
            "decisions": decisions,
        }

    async def decide_finding(
        self,
        finding_id: UUID,
        org_id: UUID,
        user_id: UUID,
        request: FindingDecisionRequest,
    ) -> Finding:
        """Decide on a specific finding."""
        result = await self.db.execute(
            select(Finding)
            .where(Finding.id == finding_id, Finding.org_id == org_id)
        )
        finding = result.scalar_one_or_none()
        if not finding:
            raise ValueError("Finding not found")

        critical_types = ["FACTUAL_CONTRADICTION", "OUTDATED_SOURCE", "CONFLICTING_SOURCES"]
        if finding.finding_type.value in critical_types and request.decision != ReviewDecisionEnum.APPROVED:
            if not request.reason:
                raise ValueError("Reason required for overriding critical findings")

        finding.status = "RESOLVED" if request.decision == ReviewDecisionEnum.APPROVED else "OVERRIDDEN"
        finding.resolved_by = user_id
        finding.resolved_at = datetime.now(timezone.utc)
        finding.override_reason = request.reason

        feedback = FindingFeedback(
            org_id=org_id,
            finding_id=finding.id,
            user_id=user_id,
            feedback_type=FeedbackType.OVERRIDDEN if request.decision != ReviewDecisionEnum.APPROVED else FeedbackType.ACCEPTED,
            reason=request.reason,
        )
        self.db.add(feedback)

        # Check if all findings resolved
        all_findings = await self.db.execute(
            select(Finding).where(Finding.content_id == finding.content_id)
        )
        all_resolved = all(f.status in ["RESOLVED", "OVERRIDDEN"] for f in all_findings.scalars().all())
        
        if all_resolved:
            content_result = await self.db.execute(
                select(ContentItem).where(ContentItem.id == finding.content_id)
            )
            content = content_result.scalar_one_or_none()
            if content:
                content.status = ContentStatus.APPROVED
                content.approved_at = datetime.now(timezone.utc)
                content.reviewer_id = user_id

        await self.db.commit()
        await self.db.refresh(finding)

        audit_service = AuditService(self.db)
        await audit_service.log(
            org_id=org_id,
            user_id=user_id,
            entity_type="finding",
            entity_id=finding.id,
            action="DECIDE",
            old_value={"status": "OPEN"},
            new_value={"status": finding.status, "decision": request.decision.value, "reason": request.reason},
        )

        return finding

    async def decide_content(
        self,
        content_id: UUID,
        org_id: UUID,
        user_id: UUID,
        request: ContentDecisionRequest,
    ) -> ContentItem:
        """Bulk decide on content with all findings."""
        result = await self.db.execute(
            select(ContentItem)
            .where(ContentItem.id == content_id, ContentItem.org_id == org_id)
        )
        content = result.scalar_one_or_none()
        if not content:
            raise ValueError("Content not found")

        for fd in request.finding_decisions:
            finding_result = await self.db.execute(
                select(Finding).where(Finding.id == fd.finding_id, Finding.org_id == org_id)
            )
            finding = finding_result.scalar_one_or_none()
            if finding:
                finding.status = "RESOLVED" if fd.decision == ReviewDecisionEnum.APPROVED else "OVERRIDDEN"
                finding.resolved_by = user_id
                finding.resolved_at = datetime.now(timezone.utc)
                finding.override_reason = fd.reason

                feedback = FindingFeedback(
                    org_id=org_id,
                    finding_id=finding.id,
                    user_id=user_id,
                    feedback_type=FeedbackType.OVERRIDDEN if fd.decision != ReviewDecisionEnum.APPROVED else FeedbackType.ACCEPTED,
                    reason=fd.reason,
                )
                self.db.add(feedback)

        if request.decision == ReviewDecisionEnum.APPROVED:
            content.status = ContentStatus.APPROVED
            content.approved_at = datetime.now(timezone.utc)
        elif request.decision == ReviewDecisionEnum.REJECTED:
            content.status = ContentStatus.REJECTED
            content.rejected_at = datetime.now(timezone.utc)
        else:
            content.status = ContentStatus.CHANGES_REQUESTED

        content.reviewer_id = user_id

        review_decision = ReviewDecision(
            org_id=org_id,
            content_id=content_id,
            reviewer_id=user_id,
            decision=request.decision,
            comment=request.comment,
        )
        self.db.add(review_decision)

        await self.db.commit()
        await self.db.refresh(content)

        audit_service = AuditService(self.db)
        await audit_service.log(
            org_id=org_id,
            user_id=user_id,
            entity_type="content_submission",
            entity_id=content.id,
            action="DECIDE",
            old_value={"status": content.status.value},
            new_value={"decision": request.decision.value, "comment": request.comment},
        )

        return content

    async def add_feedback(
        self,
        finding_id: UUID,
        org_id: UUID,
        user_id: UUID,
        request: FindingFeedbackCreate,
    ) -> FindingFeedback:
        """Add feedback to a finding."""
        finding_result = await self.db.execute(
            select(Finding).where(Finding.id == finding_id, Finding.org_id == org_id)
        )
        finding = finding_result.scalar_one_or_none()
        if not finding:
            raise ValueError("Finding not found")

        feedback = FindingFeedback(
            org_id=org_id,
            finding_id=finding_id,
            user_id=user_id,
            feedback_type=request.feedback_type,
            reason=request.reason,
        )
        self.db.add(feedback)
        await self.db.commit()
        await self.db.refresh(feedback)

        return feedback

    async def check_guideline_ambiguity(self, org_id: UUID) -> List[dict]:
        """Check for ambiguous guidelines based on override patterns."""
        # This would analyze override patterns and suggest clarifications
        # Simplified implementation
        return []
