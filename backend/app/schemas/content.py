from datetime import datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.content import ContentStatus, RiskLevel, ContentType, Channel


class ContentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content_type: ContentType
    channel: Channel
    original_content: str = Field(..., min_length=1, max_length=50000)
    product_context: Optional[str] = None
    campaign_context: Optional[str] = None
    locale: str = "en"


class ContentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content_type: Optional[ContentType] = None
    channel: Optional[Channel] = None
    original_content: Optional[str] = Field(None, min_length=1, max_length=50000)
    current_content: Optional[str] = Field(None, max_length=50000)
    status: Optional[ContentStatus] = None
    risk_level: Optional[RiskLevel] = None
    product_context: Optional[str] = None
    campaign_context: Optional[str] = None
    locale: Optional[str] = None
    reviewer_id: Optional[UUID] = None


class ContentVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    version_number: int
    content: str
    change_reason: Optional[str]
    created_by: Optional["UserResponse"] = None
    created_at: datetime


class ContentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    title: str
    content_type: ContentType
    channel: Channel
    original_content: str
    current_content: str
    content_hash: str
    status: ContentStatus
    risk_level: Optional[RiskLevel]
    product_context: Optional[str]
    campaign_context: Optional[str]
    locale: str
    created_by: Optional["UserResponse"] = None
    reviewer: Optional["UserResponse"] = None
    submitted_at: Optional[datetime]
    approved_at: Optional[datetime]
    rejected_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class ContentDetailResponse(ContentResponse):
    versions: List[ContentVersionResponse] = []
    runs: List["AnalysisRunResponse"] = []
    claims: List["ClaimResponse"] = []
    findings: List["FindingResponse"] = []
    decisions: List["ReviewDecisionResponse"] = []


# Forward references
from app.schemas.auth import UserResponse
from app.schemas.analysis import AnalysisRunResponse, ClaimResponse, FindingResponse
from app.schemas.review import ReviewDecisionResponse

ContentDetailResponse.model_rebuild()