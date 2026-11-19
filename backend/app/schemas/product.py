from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.product import ProductStatus


class ProductBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    name: str = Field(..., min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=100)
    model_or_version: Optional[str] = Field(None, max_length=100)
    launch_date: Optional[datetime] = None
    status: ProductStatus = ProductStatus.ACTIVE
    description: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=100)
    model_or_version: Optional[str] = Field(None, max_length=100)
    launch_date: Optional[datetime] = None
    status: Optional[ProductStatus] = None
    description: Optional[str] = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    facts_count: int = 0
    created_at: datetime
    updated_at: datetime
