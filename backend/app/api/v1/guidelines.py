from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user_flexible, get_db_with_org, require_admin
from app.models.guideline import BrandGuideline, GuidelineCategory, Severity
from app.schemas.guideline import (
    BrandGuidelineCreate,
    BrandGuidelineUpdate,
    BrandGuidelineResponse,
)
from app.services.audit import AuditService

router = APIRouter()


@router.get("", response_model=List[BrandGuidelineResponse])
async def list_guidelines(
    active_only: bool = False,
    category: Optional[GuidelineCategory] = None,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List all brand guidelines."""
    query = select(BrandGuideline).where(BrandGuideline.org_id == user.org_id)
    if active_only:
        query = query.where(BrandGuideline.active == True)
    if category:
        query = query.where(BrandGuideline.category == category)
    query = query.order_by(BrandGuideline.rule_code)
    result = await db.execute(query)
    guidelines = result.scalars().all()
    return [BrandGuidelineResponse.model_validate(g) for g in guidelines]


@router.post("", response_model=BrandGuidelineResponse, status_code=status.HTTP_201_CREATED)
async def create_guideline(
    request: BrandGuidelineCreate,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Create a new brand guideline (ADMIN only)."""
    # Check for duplicate rule_code
    existing = await db.execute(
        select(BrandGuideline).where(
            BrandGuideline.org_id == user.org_id,
            BrandGuideline.rule_code == request.rule_code,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Guideline with code '{request.rule_code}' already exists",
        )

    guideline = BrandGuideline(
        org_id=user.org_id,
        **request.model_dump(),
        created_by=user.user_id,
    )
    db.add(guideline)
    await db.commit()
    await db.refresh(guideline)

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="brand_guideline",
        entity_id=guideline.id,
        action="CREATE",
        old_value=None,
        new_value={"rule_code": guideline.rule_code, "title": guideline.title},
    )

    return BrandGuidelineResponse.model_validate(guideline)


@router.get("/{guideline_id}", response_model=BrandGuidelineResponse)
async def get_guideline(
    guideline_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get a specific guideline."""
    result = await db.execute(
        select(BrandGuideline).where(
            BrandGuideline.id == guideline_id,
            BrandGuideline.org_id == user.org_id,
        )
    )
    guideline = result.scalar_one_or_none()
    if not guideline:
        raise HTTPException(status_code=404, detail="Guideline not found")
    return BrandGuidelineResponse.model_validate(guideline)


@router.patch("/{guideline_id}", response_model=BrandGuidelineResponse)
async def update_guideline(
    guideline_id: UUID,
    request: BrandGuidelineUpdate,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Update a brand guideline (ADMIN only)."""
    result = await db.execute(
        select(BrandGuideline).where(
            BrandGuideline.id == guideline_id,
            BrandGuideline.org_id == user.org_id,
        )
    )
    guideline = result.scalar_one_or_none()
    if not guideline:
        raise HTTPException(status_code=404, detail="Guideline not found")

    old_values = {
        "title": guideline.title,
        "description": guideline.description,
        "category": guideline.category.value,
        "severity": guideline.severity.value,
        "active": guideline.active,
    }

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(guideline, field, value)

    # Increment version on update
    guideline.version += 1

    await db.commit()
    await db.refresh(guideline)

    new_values = {
        "title": guideline.title,
        "description": guideline.description,
        "category": guideline.category.value,
        "severity": guideline.severity.value,
        "active": guideline.active,
        "version": guideline.version,
    }

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="brand_guideline",
        entity_id=guideline.id,
        action="UPDATE",
        old_value=old_values,
        new_value=new_values,
    )

    return BrandGuidelineResponse.model_validate(guideline)


@router.post("/{guideline_id}/deactivate", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_guideline(
    guideline_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Deactivate a guideline (ADMIN only)."""
    result = await db.execute(
        select(BrandGuideline).where(
            BrandGuideline.id == guideline_id,
            BrandGuideline.org_id == user.org_id,
        )
    )
    guideline = result.scalar_one_or_none()
    if not guideline:
        raise HTTPException(status_code=404, detail="Guideline not found")

    guideline.active = False
    await db.commit()

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="brand_guideline",
        entity_id=guideline.id,
        action="DEACTIVATE",
        old_value={"active": True},
        new_value={"active": False},
    )
