import enum
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional, List
from sqlalchemy import String, Text, Enum as SQLEnum, ForeignKey, Index, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.base import Base, TimestampMixin, UUIDMixin, OrgMixin


class ProductStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    DRAFT = "DRAFT"


class Product(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "products"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    model_or_version: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    launch_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[ProductStatus] = mapped_column(
        SQLEnum(ProductStatus, native_enum=False),
        default=ProductStatus.ACTIVE,
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index("ix_products_org_id", "org_id"),
        Index("ix_products_org_name", "org_id", "name"),
    )

    def __repr__(self) -> str:
        return f"<Product(id={self.id}, name={self.name}, status={self.status})>"
