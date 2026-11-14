from datetime import datetime
from uuid import UUID
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from app.models.fact import FactVerificationStatus


class ApprovedFactBase(BaseModel):
    fact_code: str = Field(..., min_length=1, max_length=50, pattern=r'^[A-Z0-9-]+$')
    title: str = Field(..., min_length=1, max_length=200)
    fact_text: str = Field(..., min_length=1, max_length=5000)
    entity_name: Optional[str] = Field(None, max_length=200)
    attribute_name: Optional[str] = Field(None, max_length=200)
    value_text: Optional[str] = None
    value_numeric: Optional[Decimal] = None
    unit: Optional[str] = Field(None, max_length=50)
    qualifier: Optional[str] = Field(None, max_length=50)
    source_document_id: Optional[UUID] = None
    source_name: str = Field(..., min_length=1, max_length=200)
    source_reference: Optional[str] = Field(None, max_length=500)
    source_excerpt: Optional[str] = Field(None, max_length=2000)
    source_page_start: Optional[int] = None
    source_page_end: Optional[int] = None
    effective_from: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=2000)


class ApprovedFactCreate(ApprovedFactBase):
    pass


class ApprovedFactUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    fact_text: Optional[str] = Field(None, min_length=1, max_length=5000)
    entity_name: Optional[str] = Field(None, max_length=200)
    attribute_name: Optional[str] = Field(None, max_length=200)
    value_text: Optional[str] = None
    value_numeric: Optional[Decimal] = None
    unit: Optional[str] = Field(None, max_length=50)
    qualifier: Optional[str] = Field(None, max_length=50)
    source_name: Optional[str] = Field(None, min_length=1, max_length=200)
    source_reference: Optional[str] = Field(None, max_length=500)
    source_excerpt: Optional[str] = Field(None, max_length=2000)
    source_page_start: Optional[int] = None
    source_page_end: Optional[int] = None
    verification_status: Optional[FactVerificationStatus] = None
    effective_from: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=2000)


class ApprovedFactResponse(ApprovedFactBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    verification_status: FactVerificationStatus
    created_by: Optional["UserResponse"] = None
    created_at: datetime
    updated_at: datetime


# Forward reference
from app.schemas.auth import UserResponse
ApprovedFactResponse.model_rebuild()