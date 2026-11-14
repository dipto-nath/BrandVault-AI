from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user_flexible, get_db_with_org, require_admin
from app.models.fact import ApprovedFact, FactVerificationStatus
from app.models.source import Source
from app.schemas.fact import (
    ApprovedFactCreate,
    ApprovedFactUpdate,
    ApprovedFactResponse,
)
from app.services.audit import AuditService

router = APIRouter()


@router.get("", response_model=List[ApprovedFactResponse])
async def list_facts(
    active_only: bool = True,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List all approved facts."""
    query = select(ApprovedFact).where(ApprovedFact.org_id == user.org_id)
    if active_only:
        query = query.where(ApprovedFact.verification_status == FactVerificationStatus.APPROVED)
    query = query.order_by(ApprovedFact.created_at.desc())
    result = await db.execute(query)
    facts = result.scalars().all()
    return [ApprovedFactResponse.model_validate(f) for f in facts]


@router.post("", response_model=ApprovedFactResponse, status_code=status.HTTP_201_CREATED)
async def create_fact(
    request: ApprovedFactCreate,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Create a new approved fact."""
    # Check for duplicate fact_code
    existing = await db.execute(
        select(ApprovedFact).where(
            ApprovedFact.org_id == user.org_id,
            ApprovedFact.fact_code == request.fact_code,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Fact with code '{request.fact_code}' already exists",
        )

    # Validate source document if provided
    if request.source_document_id:
        source_result = await db.execute(
            select(Source).where(
                Source.id == request.source_document_id,
                Source.org_id == user.org_id,
            )
        )
        if not source_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Source document not found",
            )

    fact = ApprovedFact(
        org_id=user.org_id,
        **request.model_dump(),
        created_by=user.user_id,
    )
    db.add(fact)
    await db.commit()
    await db.refresh(fact)

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="approved_fact",
        entity_id=fact.id,
        action="CREATE",
        old_value=None,
        new_value={"fact_code": fact.fact_code, "title": fact.title},
    )

    return ApprovedFactResponse.model_validate(fact)


@router.get("/{fact_id}", response_model=ApprovedFactResponse)
async def get_fact(
    fact_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get a specific fact."""
    result = await db.execute(
        select(ApprovedFact).where(
            ApprovedFact.id == fact_id,
            ApprovedFact.org_id == user.org_id,
        )
    )
    fact = result.scalar_one_or_none()
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")
    return ApprovedFactResponse.model_validate(fact)


@router.patch("/{fact_id}", response_model=ApprovedFactResponse)
async def update_fact(
    fact_id: UUID,
    request: ApprovedFactUpdate,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Update an approved fact."""
    result = await db.execute(
        select(ApprovedFact).where(
            ApprovedFact.id == fact_id,
            ApprovedFact.org_id == user.org_id,
        )
    )
    fact = result.scalar_one_or_none()
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")

    old_values = {
        "title": fact.title,
        "fact_text": fact.fact_text,
        "verification_status": fact.verification_status.value if fact.verification_status else None,
    }

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(fact, field, value)

    await db.commit()
    await db.refresh(fact)

    new_values = {
        "title": fact.title,
        "fact_text": fact.fact_text,
        "verification_status": fact.verification_status.value if fact.verification_status else None,
    }

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="approved_fact",
        entity_id=fact.id,
        action="UPDATE",
        old_value=old_values,
        new_value=new_values,
    )

    return ApprovedFactResponse.model_validate(fact)


@router.delete("/{fact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fact(
    fact_id: UUID,
    user = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Delete an approved fact."""
    result = await db.execute(
        select(ApprovedFact).where(
            ApprovedFact.id == fact_id,
            ApprovedFact.org_id == user.org_id,
        )
    )
    fact = result.scalar_one_or_none()
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")

    await db.delete(fact)
    await db.commit()

    audit_service = AuditService(db)
    await audit_service.log(
        org_id=user.org_id,
        user_id=user.user_id,
        entity_type="approved_fact",
        entity_id=fact.id,
        action="DELETE",
        old_value={"fact_code": fact.fact_code},
        new_value=None,
    )
