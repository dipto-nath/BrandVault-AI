from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import json
import hashlib

from app.models.content import ContentItem, ContentVersion
from app.models.analysis import Claim
from app.models.finding import Finding, FindingEvidence, FindingType, Severity, EvidenceRelation
from app.models.review import ReviewDecision, FindingFeedback
from app.models.audit import AuditEvent
from app.models.passport import PassportRecord
from app.schemas.passport import (
    PassportRecordResponse,
    PassportClaim,
    PassportEvidence,
    PassportFinding,
    PassportAuditEntry,
)
from app.schemas.analysis import ClaimResponse, FindingResponse
from app.services.audit import AuditService


class PassportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_passport(
        self,
        content_id: UUID,
        org_id: UUID,
        version_id: Optional[UUID] = None,
    ) -> PassportRecordResponse:
        """Generate Brand Evidence Passport for content."""
        # Get content
        content_result = await self.db.execute(
            select(ContentItem).where(ContentItem.id == content_id, ContentItem.org_id == org_id)
        )
        content = content_result.scalar_one_or_none()
        if not content:
            raise ValueError("Content not found")

        # Get version if specified
        version_number = 1
        if version_id:
            version_result = await self.db.execute(
                select(ContentVersion).where(ContentVersion.id == version_id)
            )
            version = version_result.scalar_one_or_none()
            if version:
                version_number = version.version_number
        else:
            # Get latest version
            version_result = await self.db.execute(
                select(ContentVersion)
                .where(ContentVersion.content_id == content_id)
                .order_by(ContentVersion.version_number.desc())
                .limit(1)
            )
            version = version_result.scalar_one_or_none()
            if version:
                version_number = version.version_number

        # Get claims
        claims_result = await self.db.execute(
            select(Claim).where(Claim.content_id == content_id).order_by(Claim.created_at)
        )
        claims = claims_result.scalars().all()

        # Get findings with evidence
        findings_result = await self.db.execute(
            select(Finding).where(Finding.content_id == content_id).order_by(Finding.created_at)
        )
        findings = findings_result.scalars().all()

        # Get decisions
        decisions_result = await self.db.execute(
            select(ReviewDecision).where(ReviewDecision.content_id == content_id).order_by(ReviewDecision.created_at)
        )
        decisions = decisions_result.scalars().all()

        # Get audit trail
        audit_result = await self.db.execute(
            select(AuditEvent)
            .where(AuditEvent.entity_id == content_id)
            .order_by(AuditEvent.created_at)
        )
        audit_events = audit_result.scalars().all()

        # Build passport response
        passport = self._build_passport_json(
            content, version_number, claims, findings, decisions, audit_events
        )

        # Save passport record
        passport_record = PassportRecord(
            org_id=org_id,
            content_id=content_id,
            content_version_id=version_id,
            passport_id=f"PASS-{content_id}",
            content_hash=content.content_hash,
            findings_json=[f.model_dump() for f in passport.findings],
            claims_json=[c.model_dump() for c in passport.claims],
            decisions_json=[d.__dict__ for d in decisions],
            audit_trail_json=[e.__dict__ for e in audit_events],
            generated_by=None,  # Would be set from context
        )
        self.db.add(passport_record)
        await self.db.commit()

        return passport

    def _build_passport_json(
        self,
        content: ContentItem,
        version_number: int,
        claims: List[Claim],
        findings: List[Finding],
        decisions: List[ReviewDecision],
        audit_events: List[AuditEvent],
    ) -> PassportRecordResponse:
        """Build passport JSON structure."""
        # Build claims
        passport_claims = []
        for claim in claims:
            evidence = []
            for ev in claim.evidence or []:
                evidence.append(PassportEvidence(
                    source_name=ev.get("source_name", ""),
                    source_version=ev.get("source_version"),
                    page=ev.get("page"),
                    excerpt=ev.get("excerpt", ""),
                    relation=EvidenceRelation(ev.get("relation", "RELATED")),
                ))
            
            passport_claims.append(PassportClaim(
                claim_text=claim.claim_text,
                claim_type=claim.claim_type,
                verification_status=claim.verification_status,
                explanation=claim.explanation,
                evidence=evidence,
            ))

        # Build findings
        passport_findings = []
        for finding in findings:
            evidence = []
            for fe in finding.evidence or []:
                evidence.append(PassportEvidence(
                    source_name=fe.approved_fact.source_name if fe.approved_fact else fe.source_chunk.source_name if fe.source_chunk else "Unknown",
                    source_version=None,
                    page=fe.source_chunk.page_start if fe.source_chunk else fe.approved_fact.source_page_start if fe.approved_fact else None,
                    excerpt=fe.evidence_excerpt,
                    relation=fe.evidence_relation,
                ))
            
            passport_findings.append(PassportFinding(
                finding_type=finding.finding_type,
                severity=finding.severity,
                title=finding.title,
                excerpt=finding.excerpt,
                explanation=finding.explanation,
                suggested_correction=finding.suggested_correction,
                status=finding.status,
                evidence=evidence,
                override_reason=finding.override_reason,
            ))

        # Build decisions
        decisions_json = []
        for d in decisions:
            decisions_json.append({
                "decision": d.decision.value,
                "comment": d.comment,
                "reviewer_id": str(d.reviewer_id),
                "created_at": d.created_at.isoformat(),
            })

        # Build audit trail
        audit_trail = []
        for a in audit_events:
            audit_trail.append(PassportAuditEntry(
                timestamp=a.created_at,
                actor=a.user.email if a.user else "System",
                role=a.user.memberships[0].role.value if a.user and a.user.memberships else "System",
                action=a.action,
                details=a.metadata or {},
            ))

        return PassportRecordResponse(
            passport_id=f"PASS-{content.id}",
            content_hash=content.content_hash,
            content_title=content.title,
            content_version=version_number,
            claims=passport_claims,
            findings=passport_findings,
            decisions=decisions_json,
            audit_trail=audit_trail,
            generated_at=datetime.now(timezone.utc),
            generated_by="System",
            ai_provider="Gemini",
            ai_model="gemini-1.5-flash",
            prompt_version="v1.0",
        )

    async def export_passport(self, passport_id: str, format: str) -> bytes:
        """Export passport as JSON or PDF."""
        result = await self.db.execute(
            select(PassportRecord).where(PassportRecord.passport_id == passport_id)
        )
        passport = result.scalar_one_or_none()
        if not passport:
            raise ValueError("Passport not found")

        if format == "json":
            return json.dumps({
                "passport_id": passport.passport_id,
                "content_hash": passport.content_hash,
                "findings": passport.findings_json,
                "claims": passport.claims_json,
                "decisions": passport.decisions_json,
                "audit_trail": passport.audit_trail_json,
                "generated_at": passport.generated_at.isoformat(),
            }, indent=2).encode()
        else:
            # PDF generation would go here
            return b"PDF not implemented"

    async def get_passport_history(
        self,
        content_id: UUID,
        org_id: UUID,
    ) -> List[PassportRecordResponse]:
        """Get all passport versions for content."""
        result = await self.db.execute(
            select(PassportRecord)
            .where(PassportRecord.content_id == content_id, PassportRecord.org_id == org_id)
            .order_by(PassportRecord.generated_at.desc())
        )
        passports = result.scalars().all()
        
        # Convert to response format
        return [
            PassportRecordResponse(
                passport_id=p.passport_id,
                content_hash=p.content_hash,
                content_title="",  # Would need join
                content_version=1,
                claims=[],
                findings=[],
                decisions=[],
                audit_trail=[],
                generated_at=p.generated_at,
                generated_by="",
                ai_provider="",
                ai_model="",
                prompt_version="",
            )
            for p in passports
        ]
