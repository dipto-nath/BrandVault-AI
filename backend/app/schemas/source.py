from datetime import datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.source import SourceStatus


class SourceUploadResponse(BaseModel):
    source_id: UUID
    status: SourceStatus = "processing"


class SourceChunkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    page_start: Optional[int]
    page_end: Optional[int]
    text: str
    token_count: Optional[int]


class SourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    source_name: str
    mime_type: str
    file_size: Optional[int]
    document_status: SourceStatus
    page_count: Optional[int]
    chunk_count: Optional[int]
    extraction_error: Optional[str]
    valid_from: Optional[datetime]
    valid_to: Optional[datetime]
    version: int
    uploaded_at: datetime
    approved_at: Optional[datetime]
    approved_by: Optional["UserResponse"] = None


class SourceDetailResponse(SourceResponse):
    chunks: List[SourceChunkResponse] = []


class SourceApproveRequest(BaseModel):
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None


# Forward reference
from app.schemas.auth import UserResponse
SourceResponse.model_rebuild()