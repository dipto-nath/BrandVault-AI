import enum
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional, Dict, List
from sqlalchemy import String, Text, Enum as SQLEnum, ForeignKey, Index, DateTime, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB

from app.models.base import Base, TimestampMixin, UUIDMixin, OrgMixin
from app.models.guideline import GuidelineCategory, Severity
from app.models.fact_candidate import CandidateStatus


class GuidelineCandidate(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "guideline_candidates"

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
    rule_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[GuidelineCategory] = mapped_column(
        SQLEnum(GuidelineCategory, native_enum=False),
        default=GuidelineCategory.TONE,
        nullable=False,
    )
    severity: Mapped[Severity] = mapped_column(
        SQLEnum(Severity, native_enum=False),
        default=Severity.MEDIUM,
        nullable=False,
    )
    examples: Mapped[Optional[Dict[str, List[str]]]] = mapped_column(JSONB, nullable=True)
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
        Index("ix_guideline_cand_org_status", "org_id", "status"),
        Index("ix_guideline_cand_source", "source_id"),
    )
