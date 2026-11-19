from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_current_user_flexible,
    get_db_with_org,
    require_manager_or_admin,
    require_admin,
    UserContext,
)
from app.models.product import ProductStatus
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.services.products import ProductService

router = APIRouter()


@router.get("", response_model=List[ProductResponse])
async def list_products(
    status: Optional[ProductStatus] = Query(None),
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """List products registered for current organization."""
    service = ProductService(db)
    return await service.list_products(user.org_id, status_filter=status)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    user: UserContext = Depends(require_manager_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Register a new product (Manager or Admin)."""
    service = ProductService(db)
    return await service.create_product(user.org_id, user.user_id, data)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    user: UserContext = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Get product details."""
    service = ProductService(db)
    return await service.get_product(user.org_id, product_id)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    data: ProductUpdate,
    user: UserContext = Depends(require_manager_or_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Update a product (Manager or Admin)."""
    service = ProductService(db)
    return await service.update_product(user.org_id, user.user_id, product_id, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    user: UserContext = Depends(require_admin),
    db: AsyncSession = Depends(get_db_with_org),
):
    """Delete a product (Admin only)."""
    service = ProductService(db)
    await service.delete_product(user.org_id, user.user_id, product_id)
    return None
