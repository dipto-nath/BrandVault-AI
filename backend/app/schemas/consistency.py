from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime

from app.schemas.fact import ApprovedFactResponse


class ConsistencyCheckLanguage(str):
    HI = "hi"
    BN = "bn"
    EN = "en"


class ConsistencyCheckStatus(str):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ConsistencyFindingType(str):
    NUMERIC_MISMATCH = "NUMERIC_MISMATCH"
    UNIT_MISMATCH = "UNIT_MISMATCH"
    DATE_MISMATCH = "DATE_MISMATCH"
    PRODUCT_NAME_MISMATCH = "PRODUCT_NAME_MISMATCH"
    VERSION_MISMATCH = "VERSION_MISMATCH"
    TERMINOLOGY_MISMATCH = "TERMINOLOGY_MISMATCH"
    UNSUPPORTED_CLAIM = "UNSUPPORTED_CLAIM"
    UNVERIFIED_CLAIM = "UNVERIFIED_CLAIM"


class ConsistencyFindingStatus(str):
    OPEN = "OPEN"
    CONFIRMED = "CONFIRMED"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    NEEDS_CONTEXT = "NEEDS_CONTEXT"
    RESOLVED = "RESOLVED"


class ConsistencyEvidence(BaseModel):
    localized_claim: str
    back_translation: str
    approved_fact_text: str
    approved_fact_id: UUID
    source_document: str
    source_locator: str
    fact_set_version: str
    values: Optional[Dict[str, Dict[str, Any]]] = None


class ConsistencyCheckSubmissionCreate(BaseModel):
    language: str = Field(..., pattern="^(hi|bn|en)$")
    fact_set_id: UUID
    text: str = Field(..., min_length=1, max_length=20000)


class ConsistencyCheckSubmissionResponse(BaseModel):
    id: UUID
    language: str
    raw_text: str
    normalized_text: str
    fact_set_id: UUID
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConsistencyCheckJobResponse(BaseModel):
    id: UUID
    submission_id: UUID
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConsistencyEvidenceResponse(BaseModel):
    localized_claim: str
    back_translation: str
    approved_fact_text: str
    approved_fact_id: UUID
    source_document: str
    source_locator: str
    fact_set_version: str
    values: Optional[Dict[str, Dict[str, Any]]] = None


class ConsistencyFindingResponse(BaseModel):
    id: UUID
    job_id: UUID
    claim_id: Optional[UUID] = None
    finding_type: str
    severity: str
    title: str
    localized_claim: str
    back_translation: str
    approved_fact: str
    approved_fact_id: UUID
    evidence: ConsistencyEvidenceResponse
    confidence: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConsistencyCheckJobDetailResponse(BaseModel):
    id: UUID
    submission_id: UUID
    status: str
    findings: List["ConsistencyFindingResponse"]
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConsistencyCheckSubmitResponse(BaseModel):
    job_id: UUID
    status: str


class ApprovedFactSetCreate(BaseModel):
    version: str = Field(..., min_length=1, max_length=50)
    brand_id: Optional[UUID] = None
    product_id: Optional[UUID] = None


class ApprovedFactSetUpdate(BaseModel):
    version: Optional[str] = Field(None, min_length=1, max_length=50)
    status: Optional[str] = None
    brand_id: Optional[UUID] = None
    product_id: Optional[UUID] = None


class ApprovedFactSetResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    brand_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    version: str
    status: str
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GlossaryTermCreate(BaseModel):
    term_en: str = Field(..., min_length=1, max_length=200)
    term_hi: str = Field(..., min_length=1, max_length=200)
    term_bn: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    protected: bool = False
    valid_from: datetime
    valid_to: Optional[datetime] = None


class GlossaryTermUpdate(BaseModel):
    term_en: Optional[str] = Field(None, min_length=1, max_length=200)
    term_hi: Optional[str] = Field(None, min_length=1, max_length=200)
    term_bn: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    protected: Optional[bool] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None


class GlossaryTermResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    term_en: str
    term_hi: str
    term_bn: str
    category: str
    protected: bool
    valid_from: datetime
    valid_to: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EvaluationCaseCreate(BaseModel):
    language: str = Field(..., pattern="^(hi|bn|en)$")
    input_text: str = Field(..., min_length=1)
    expected_labels: List[str]
    dataset_version: str = Field(..., min_length=1, max_length=50)


class EvaluationCaseResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    language: str
    input_text: str
    expected_labels: List[str]
    dataset_version: str
    created_at: datetime

    class Config:
        from_attributes = True


# Consistency check job detail
ConsistencyCheckJobDetailResponse.model_rebuild()