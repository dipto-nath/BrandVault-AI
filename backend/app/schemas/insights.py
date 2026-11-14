from datetime import datetime
from uuid import UUID
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict
from app.models.suggestion import SuggestionStatus


class GuidelineSuggestionCreate(BaseModel):
    guideline_id: UUID
    title: str = Field(..., min_length=1, max_length=200)
    suggested_change: str = Field(..., min_length=1, max_length=4000)
    supporting_feedback_ids: List[UUID] = []


class GuidelineSuggestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    guideline_id: UUID
    title: str
    suggested_change: str
    supporting_feedback_ids: List[UUID]
    status: SuggestionStatus
    created_by: Optional["UserResponse"] = None
    reviewed_by: Optional["UserResponse"] = None
    created_at: datetime
    reviewed_at: Optional[datetime]


class InsightsResponse(BaseModel):
    total_submissions: int
    approved: int
    rejected: int
    pending: int
    high_risk: int
    total_feedback: int
    top_reasons: List[Dict[str, Any]]
    frequently_overridden: List[Dict[str, Any]]
    suggestions: List[GuidelineSuggestionResponse]


# Forward reference
from app.schemas.auth import UserResponse

GuidelineSuggestionResponse.model_rebuild()