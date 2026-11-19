from datetime import datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.analysis import AnalysisStatus, VerificationStatus
from app.models.finding import FindingType, Severity, EvidenceRelation


class AnalysisTriggerResponse(BaseModel):
    task_id: str
    content_id: UUID


class AnalysisStatusResponse(BaseModel):
    status: AnalysisStatus
    progress: int = 0
    findings_count: int = 0
    claims_count: int = 0
    error: Optional[str] = None


class AnalysisRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: UUID
    provider: str
    model_name: str
    prompt_version: str
    status: AnalysisStatus
    result: Optional[dict]
    error_message: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]
    duration_ms: Optional[int]


class ClaimCreate(BaseModel):
    claim_text: str
    claim_type: str = "FACTUAL"
    normalized_value: Optional[str] = None
    unit: Optional[str] = None
    qualifier: Optional[str] = None
    entity_name: Optional[str] = None
    attribute_name: Optional[str] = None
    explanation: Optional[str] = None
    confidence: Optional[float] = None


class ClaimResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    claim_text: str
    claim_type: str
    normalized_value: Optional[str]
    unit: Optional[str]
    qualifier: Optional[str]
    entity_name: Optional[str]
    attribute_name: Optional[str]
    verification_status: Optional[VerificationStatus]
    explanation: str
    confidence: Optional[float]
    evidence_ids: List[UUID]
    source_chunk_ids: List[UUID]
    created_at: datetime


class FindingEvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    approved_fact: Optional["ApprovedFactResponse"] = None
    source_chunk: Optional["SourceChunkResponse"] = None
    evidence_excerpt: str
    relevance_explanation: str
    evidence_relation: EvidenceRelation


class FindingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    finding_type: FindingType
    severity: Severity
    rule_id: Optional[UUID]
    rule_code: Optional[str] = None
    title: str
    excerpt: str
    explanation: str
    suggested_correction: Optional[str]
    confidence: float
    status: str
    evidence: List[FindingEvidenceResponse] = []
    resolved_by: Optional["UserResponse"] = None
    resolved_at: Optional[datetime]
    override_reason: Optional[str]
    created_at: datetime


# Forward references
from app.schemas.fact import ApprovedFactResponse
from app.schemas.source import SourceChunkResponse
from app.schemas.auth import UserResponse

FindingEvidenceResponse.model_rebuild()
FindingResponse.model_rebuild()