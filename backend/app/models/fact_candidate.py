import enum
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional
from decimal import Decimal
from sqlalchemy import String, Text, Enum as SQLEnum, ForeignKey, Numeric, Index, DateTime, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.base import Base, TimestampMixin, UUIDMixin, OrgMixin


class CandidateStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EDITED = "EDITED"


class FactCandidate(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "fact_candidates"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
    )
    source_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("sources.id", ondelete="CASCADE"),
        nullable=True,
    )
    entity: Mapped[str] = mapped_column(String(200), nullable=False)
    attribute: Mapped[str] = mapped_column(String(200), nullable=False)
    value_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    value_numeric: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=20, scale=6), nullable=True
    )
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    qualifier: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    source_page: Mapped[Optional[int]] = mapped_column(nullable=True)
    excerpt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.8, nullable=False)
    status: Mapped[CandidateStatus] = mapped_column(
        SQLEnum(CandidateStatus, native_enum=False),
        default=CandidateStatus.PENDING,
        nullable=False,
    )
    reviewed_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        Index("ix_fact_cand_org_status", "org_id", "status"),
        Index("ix_fact_cand_source", "source_id"),
    )
