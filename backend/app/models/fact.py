import enum
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional
from decimal import Decimal
from sqlalchemy import String, Text, Enum as SQLEnum, ForeignKey, Numeric, Index, UniqueConstraint, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.base import Base, TimestampMixin, UUIDMixin, OrgMixin


class FactVerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ApprovedFact(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "approved_facts"

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
    fact_set_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("approved_fact_sets.id", ondelete="SET NULL"),
        nullable=True,
    )
    fact_code: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    fact_text: Mapped[str] = mapped_column(Text, nullable=False)
    entity_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    attribute_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    value_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    value_numeric: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=20, scale=6), nullable=True
    )
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    qualifier: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    source_document_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("sources.id", ondelete="SET NULL"),
        nullable=True,
    )
    source_name: Mapped[str] = mapped_column(String(200), nullable=False)
    source_reference: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    source_excerpt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_page_start: Mapped[Optional[int]] = mapped_column(nullable=True)
    source_page_end: Mapped[Optional[int]] = mapped_column(nullable=True)
    verification_status: Mapped[FactVerificationStatus] = mapped_column(
        SQLEnum(FactVerificationStatus, native_enum=False),
        default=FactVerificationStatus.PENDING,
        nullable=False,
    )
    effective_from: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    source_document: Mapped[Optional["Source"]] = relationship(
        "Source", lazy="selectin"
    )
    creator: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[created_by], lazy="selectin"
    )
    fact_set: Mapped[Optional["ApprovedFactSet"]] = relationship(
        "ApprovedFactSet", back_populates="facts", lazy="selectin"
    )

    __table_args__ = (
        UniqueConstraint("org_id", "fact_code", name="uq_fact_org_code"),
        Index("ix_facts_org_entity", "org_id", "entity_name"),
        Index("ix_facts_org_status", "org_id", "verification_status"),
        Index(
            "ix_facts_validity",
            "org_id",
            "effective_from",
            "expires_at",
            postgresql_where=(
                "effective_from IS NOT NULL OR expires_at IS NOT NULL"
            ),
        ),
    )

    def __repr__(self) -> str:
        return f"<ApprovedFact(id={self.id}, code={self.fact_code}, entity={self.entity_name})>"