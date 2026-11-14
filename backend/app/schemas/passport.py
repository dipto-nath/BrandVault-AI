from datetime import datetime
from uuid import UUID
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict
from app.models.finding import FindingType, Severity, EvidenceRelation
from app.models.analysis import VerificationStatus


class PassportEvidence(BaseModel):
    source_name: str
    source_version: Optional[str]
    page: Optional[int]
    excerpt: str
    relation: EvidenceRelation


class PassportClaim(BaseModel):
    claim_text: str
    claim_type: str
    verification_status: VerificationStatus
    explanation: str
    evidence: List[PassportEvidence]


class PassportFinding(BaseModel):
    finding_type: FindingType
    severity: Severity
    title: str
    excerpt: str
    explanation: str
    suggested_correction: Optional[str]
    status: str
    evidence: List[PassportEvidence]
    override_reason: Optional[str]


class PassportAuditEntry(BaseModel):
    timestamp: datetime
    actor: str
    role: str
    action: str
    details: Dict[str, Any]


class PassportRecordResponse(BaseModel):
    passport_id: str
    content_hash: str
    content_title: str
    content_version: int
    claims: List[PassportClaim]
    findings: List[PassportFinding]
    decisions: List[Dict[str, Any]]
    audit_trail: List[PassportAuditEntry]
    generated_at: datetime
    generated_by: str
    ai_provider: str
    ai_model: str
    prompt_version: str