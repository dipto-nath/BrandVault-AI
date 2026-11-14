from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user_flexible, get_db_with_org
from app.models.content import ContentItem
from app.models.passport import PassportRecord
from app.schemas.passport import PassportRecordResponse
from app.services.passport import PassportService

router = APIRouter()


@router.get("/content/{content_id}", response_model=PassportRecordResponse)
async def get_passport(
    content_id: UUID,
    version_id: UUID = None,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get Brand Evidence Passport for content."""
    result = await db.execute(
        select(ContentItem)
        .where(ContentItem.id == content_id, ContentItem.org_id == user.org_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    passport_service = PassportService(db)
    passport = await passport_service.generate_passport(content_id, user.org_id, version_id)
    return passport


@router.get("/content/{content_id}/export")
async def export_passport(
    content_id: UUID,
    format: str = "json",
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Export passport as JSON or PDF."""
    result = await db.execute(
        select(ContentItem)
        .where(ContentItem.id == content_id, ContentItem.org_id == user.org_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    passport_service = PassportService(db)
    data = await passport_service.export_passport(str(content_id), format)

    from fastapi.responses import Response
    if format == "pdf":
        return Response(
            content=data,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=passport-{content_id}.pdf"},
        )
    return Response(
        content=data,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=passport-{content_id}.json"},
    )


@router.get("/content/{content_id}/history")
async def get_passport_history(
    content_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get all passport versions for content."""
    result = await db.execute(
        select(ContentItem)
        .where(ContentItem.id == content_id, ContentItem.org_id == user.org_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    passport_service = PassportService(db)
    history = await passport_service.get_passport_history(content_id, user.org_id)
    return history
