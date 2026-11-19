from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.models.product import Product, ProductStatus
from app.models.fact import ApprovedFact
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.services.audit import AuditService

logger = structlog.get_logger()


class ProductService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)

    async def list_products(
        self,
        org_id: UUID,
        status_filter: Optional[ProductStatus] = None,
    ) -> List[ProductResponse]:
        query = select(
            Product,
            func.count(ApprovedFact.id).label("facts_count"),
        ).outerjoin(
            ApprovedFact,
            and_(ApprovedFact.product_id == Product.id, ApprovedFact.org_id == org_id),
        ).where(Product.org_id == org_id)

        if status_filter:
            query = query.where(Product.status == status_filter)

        query = query.group_by(Product.id).order_by(Product.name.asc())
        result = await self.db.execute(query)
        rows = result.all()

        products = []
        for prod, count in rows:
            resp = ProductResponse.model_validate(prod)
            resp.facts_count = count
            products.append(resp)
        return products

    async def get_product(self, org_id: UUID, product_id: UUID) -> ProductResponse:
        query = select(
            Product,
            func.count(ApprovedFact.id).label("facts_count"),
        ).outerjoin(
            ApprovedFact,
            and_(ApprovedFact.product_id == Product.id, ApprovedFact.org_id == org_id),
        ).where(
            and_(Product.org_id == org_id, Product.id == product_id)
        ).group_by(Product.id)

        result = await self.db.execute(query)
        row = result.first()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {product_id} not found",
            )
        prod, count = row
        resp = ProductResponse.model_validate(prod)
        resp.facts_count = count
        return resp

    async def create_product(
        self,
        org_id: UUID,
        user_id: UUID,
        data: ProductCreate,
    ) -> ProductResponse:
        # Check if product name already exists for this org
        existing = await self.db.execute(
            select(Product).where(
                and_(Product.org_id == org_id, Product.name == data.name)
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with name '{data.name}' already exists",
            )

        prod = Product(
            org_id=org_id,
            name=data.name,
            category=data.category,
            model_or_version=data.model_or_version,
            launch_date=data.launch_date,
            status=data.status,
            description=data.description,
        )
        self.db.add(prod)
        await self.db.commit()
        await self.db.refresh(prod)

        await self.audit_service.log(
            org_id=org_id,
            user_id=user_id,
            entity_type="product",
            entity_id=prod.id,
            action="CREATE",
            old_value=None,
            new_value={"name": prod.name, "category": prod.category},
        )

        resp = ProductResponse.model_validate(prod)
        resp.facts_count = 0
        return resp

    async def update_product(
        self,
        org_id: UUID,
        user_id: UUID,
        product_id: UUID,
        data: ProductUpdate,
    ) -> ProductResponse:
        result = await self.db.execute(
            select(Product).where(
                and_(Product.org_id == org_id, Product.id == product_id)
            )
        )
        prod = result.scalar_one_or_none()
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        old_val = {"name": prod.name, "status": prod.status.value}
        update_data = data.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(prod, key, val)

        await self.db.commit()
        await self.db.refresh(prod)

        await self.audit_service.log(
            org_id=org_id,
            user_id=user_id,
            entity_type="product",
            entity_id=prod.id,
            action="UPDATE",
            old_value=old_val,
            new_value={"name": prod.name, "status": prod.status.value},
        )

        return await self.get_product(org_id, product_id)

    async def delete_product(
        self,
        org_id: UUID,
        user_id: UUID,
        product_id: UUID,
    ) -> None:
        result = await self.db.execute(
            select(Product).where(
                and_(Product.org_id == org_id, Product.id == product_id)
            )
        )
        prod = result.scalar_one_or_none()
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        prod_name = prod.name
        await self.db.delete(prod)
        await self.db.commit()

        await self.audit_service.log(
            org_id=org_id,
            user_id=user_id,
            entity_type="product",
            entity_id=product_id,
            action="DELETE",
            old_value={"name": prod_name},
            new_value=None,
        )
