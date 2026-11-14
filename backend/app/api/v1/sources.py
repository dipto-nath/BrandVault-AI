from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional
import os
import aiofiles

from app.core.database import get_db
from app.core.dependencies import get_current_user_flexible, get_db_with_org, require_admin
from app.models.source import Source, SourceChunk, SourceStatus
from app.models.organization import User
from app.schemas.source import (
    SourceUploadResponse,
    SourceResponse,
    SourceDetailResponse,
    SourceChunkResponse,
    SourceApproveRequest,
)
from app.services.ingestion import IngestionService
from app.services.audit import AuditService
import structlog

logger = structlog.get_logger()

router = APIRouter()


@router.get("", response_model=List[SourceResponse])
async def list_sources(
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List all sources for the organization."""
    result = await db.execute(
        select(Source)
        .where(Source.org_id == user.org_id)
        .order_by(Source.created_at.desc())
    )
    sources = result.scalars().all()
    return [SourceResponse.model_validate(s) for s in sources]


@router.post("/upload", response_model=SourceUploadResponse)
async def upload_source(
    file: UploadFile = File(...),
    source_name: str = Form(...),
    valid_from: Optional[str] = Form(None),
    valid_to: Optional[str] = Form(None),
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Upload a source document (PDF, DOCX, TXT)."""
    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Allowed: PDF, DOCX, DOC, TXT",
        )

    # Validate file size (10MB max)
    max_size = 10 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size: 10MB",
        )

    # Save file
    storage_path = f"/app/uploads/{user.org_id}/{file.filename}"
    os.makedirs(os.path.dirname(storage_path), exist_ok=True)
    async with aiofiles.open(storage_path, "wb") as f:
        await f.write(content)

    # Create source record
    source = Source(
        org_id=user.org_id,
        filename=file.filename,
        storage_path=storage_path,
        mime_type=file.content_type,
        file_size=len(content),
        source_name=source_name,
        document_status=SourceStatus.EXTRACTING,
        uploaded_by=user.user_id,
    )
    db.add(source)
    await db.flush()

    # Parse dates
    from datetime import datetime
    vf = datetime.fromisoformat(valid_from) if valid_from else None
    vt = datetime.fromisoformat(valid_to) if valid_to else None

    # Start async processing
    ingestion_service = IngestionService(db)
    await ingestion_service.process_source(source.id, vf, vt)

    # Log audit
    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="source",
        entity_id=source.id,
        action="UPLOAD",
        old_value=None,
        new_value={"filename": file.filename, "source_name": source_name},
    )

    return SourceUploadResponse(source_id=source.id, status=SourceStatus.EXTRACTING)


@router.get("/{source_id}", response_model=SourceDetailResponse)
async def get_source(
    source_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get source with chunks."""
    result = await db.execute(
        select(Source)
        .where(Source.id == source_id, Source.org_id == user.org_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    # Get chunks
    chunks_result = await db.execute(
        select(SourceChunk)
        .where(SourceChunk.source_id == source_id)
        .order_by(SourceChunk.chunk_index)
    )
    chunks = chunks_result.scalars().all()

    response = SourceDetailResponse.model_validate(source)
    response.chunks = [SourceChunkResponse.model_validate(c) for c in chunks]
    return response


@router.patch("/{source_id}", response_model=SourceResponse)
async def update_source(
    source_id: UUID,
    request: SourceApproveRequest,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Update source (e.g., validity dates)."""
    result = await db.execute(
        select(Source).where(Source.id == source_id, Source.org_id == user.org_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    from datetime import datetime
    if request.valid_from:
        source.valid_from = datetime.fromisoformat(request.valid_from)
    if request.valid_to:
        source.valid_to = datetime.fromisoformat(request.valid_to)

    await db.commit()
    await db.refresh(source)
    return SourceResponse.model_validate(source)


@router.post("/{source_id}/approve", response_model=SourceResponse)
async def approve_source(
    source_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Approve source for use in verification."""
    result = await db.execute(
        select(Source).where(Source.id == source_id, Source.org_id == user.org_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    from datetime import datetime, timezone
    source.document_status = SourceStatus.APPROVED
    source.approved_at = datetime.now(timezone.utc)
    source.approved_by = user.user_id
    await db.commit()
    await db.refresh(source)

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="source",
        entity_id=source.id,
        action="APPROVE",
        old_value={"status": "PENDING_REVIEW"},
        new_value={"status": "APPROVED"},
    )

    return SourceResponse.model_validate(source)


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_source(
    source_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Delete a source."""
    result = await db.execute(
        select(Source).where(Source.id == source_id, Source.org_id == user.org_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    # Delete file
    if source.storage_path and os.path.exists(source.storage_path):
        os.remove(source.storage_path)

    await db.delete(source)
    await db.commit()

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="source",
        entity_id=source.id,
        action="DELETE",
        old_value={"filename": source.filename},
        new_value=None,
    )
