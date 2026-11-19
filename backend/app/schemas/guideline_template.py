from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.guideline import GuidelineCategory, Severity
from app.models.fact_candidate import CandidateStatus


class GuidelineTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    industry: str
    rule_code: str
    title: str
    description: str
    category: GuidelineCategory
    severity: Severity
    examples: Optional[Dict[str, List[str]]] = None


class CloneTemplatesRequest(BaseModel):
    template_ids: List[UUID]


class GuidelineCandidateCreate(BaseModel):
    product_id: Optional[UUID] = None
    source_id: Optional[UUID] = None
    rule_code: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    category: GuidelineCategory = GuidelineCategory.TONE
    severity: Severity = Severity.MEDIUM
    examples: Optional[Dict[str, List[str]]] = None
    confidence: float = 0.8


class GuidelineCandidateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    product_id: Optional[UUID] = None
    source_id: Optional[UUID] = None
    rule_code: Optional[str] = None
    title: str
    description: str
    category: GuidelineCategory
    severity: Severity
    examples: Optional[Dict[str, List[str]]] = None
    confidence: float
    status: CandidateStatus
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
