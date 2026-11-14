from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.guideline import GuidelineCategory, Severity


class BrandGuidelineBase(BaseModel):
    rule_code: str = Field(..., min_length=1, max_length=50, pattern=r'^[A-Z0-9-]+$')
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=2000)
    category: GuidelineCategory
    severity: Severity
    examples: Optional[Dict[str, List[str]]] = None
    pattern: Optional[str] = None
    replacement: Optional[str] = None
    active: bool = True


class BrandGuidelineCreate(BrandGuidelineBase):
    pass


class BrandGuidelineUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=2000)
    category: Optional[GuidelineCategory] = None
    severity: Optional[Severity] = None
    examples: Optional[Dict[str, List[str]]] = None
    pattern: Optional[str] = None
    replacement: Optional[str] = None
    active: Optional[bool] = None


class BrandGuidelineResponse(BrandGuidelineBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    version: int
    created_by: Optional["UserResponse"] = None
    created_at: datetime
    updated_at: datetime


# Forward reference
from app.schemas.auth import UserResponse
BrandGuidelineResponse.model_rebuild()