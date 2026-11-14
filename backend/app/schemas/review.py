from datetime import datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.review import ReviewDecision, FeedbackType
from app.models.content import ContentStatus, RiskLevel, ContentType, Channel
from app.models.finding import FindingType, Severity


class FindingDecisionRequest(BaseModel):
    decision: ReviewDecision
    reason: Optional[str] = Field(None, max_length=2000)


class ContentDecisionRequest(BaseModel):
    decision: ReviewDecision
    comment: Optional[str] = Field(None, max_length=2000)
    finding_decisions: List[FindingDecisionRequest] = []


class ReviewQueueItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    content: "ContentResponse"
    findings_count: int
    high_severity_count: int
    oldest_finding_at: datetime


class ReviewDecisionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    decision: ReviewDecision
    comment: Optional[str]
    reviewer: "UserResponse"
    created_at: datetime


class FindingFeedbackCreate(BaseModel):
    feedback_type: FeedbackType
    reason: Optional[str] = Field(None, max_length=2000)


class FindingFeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    feedback_type: FeedbackType
    reason: Optional[str]
    user: "UserResponse"
    created_at: datetime


# Forward references
from app.schemas.content import ContentResponse
from app.schemas.auth import UserResponse

ReviewQueueItem.model_rebuild()
ReviewDecisionResponse.model_rebuild()
FindingFeedbackResponse.model_rebuild()