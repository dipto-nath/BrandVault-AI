from datetime import datetime
from uuid import UUID
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from app.models.fact_candidate import CandidateStatus


class FactCandidateBase(BaseModel):
    product_id: Optional[UUID] = None
    source_id: Optional[UUID] = None
    entity: str = Field(..., min_length=1, max_length=200)
    attribute: str = Field(..., min_length=1, max_length=200)
    value_text: Optional[str] = None
    value_numeric: Optional[Decimal] = None
    unit: Optional[str] = Field(None, max_length=50)
    qualifier: Optional[str] = Field(None, max_length=100)
    source_page: Optional[int] = None
    excerpt: Optional[str] = None
    confidence: float = 0.8


class FactCandidateCreate(FactCandidateBase):
    pass


class FactCandidateUpdate(BaseModel):
    product_id: Optional[UUID] = None
    entity: Optional[str] = None
    attribute: Optional[str] = None
    value_text: Optional[str] = None
    value_numeric: Optional[Decimal] = None
    unit: Optional[str] = None
    qualifier: Optional[str] = None
    excerpt: Optional[str] = None


class ApproveCandidateRequest(BaseModel):
    fact_code: Optional[str] = None
    title: Optional[str] = None
    notes: Optional[str] = None


class FactCandidateResponse(FactCandidateBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    status: CandidateStatus
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
