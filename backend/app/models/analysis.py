import enum
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional, List
from sqlalchemy import String, Text, Enum as SQLEnum, ForeignKey, Integer, Index, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB

from app.models.base import Base, TimestampMixin, UUIDMixin, OrgMixin


class AnalysisStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"


class VerificationStatus(str, enum.Enum):
    SUPPORTED = "SUPPORTED"
    CONTRADICTED = "CONTRADICTED"
    UNVERIFIED = "UNVERIFIED"


class AnalysisRun(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "analysis_runs"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    content_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("content_items.id", ondelete="CASCADE"),
        nullable=False,
    )
    content_version_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("content_versions.id", ondelete="SET NULL"),
        nullable=True,
    )
    provider: Mapped[str] = mapped_column(String(100), nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_version: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[AnalysisStatus] = mapped_column(
        SQLEnum(AnalysisStatus, native_enum=False),
        default=AnalysisStatus.PENDING,
        nullable=False,
    )
    result: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    metadata: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    # Relationships
    content: Mapped["ContentItem"] = relationship(
        "ContentItem", back_populates="runs", lazy="selectin"
    )
    claims: Mapped[List["Claim"]] = relationship(
        "Claim", back_populates="analysis_run", lazy="selectin", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_runs_content", "content_id"),
        Index("ix_runs_org_status", "org_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<AnalysisRun(id={self.id}, content_id={self.content_id}, status={self.status})>"


class Claim(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "claims"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    content_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("content_items.id", ondelete="CASCADE"),
        nullable=False,
    )
    analysis_run_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("analysis_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    claim_text: Mapped[str] = mapped_column(Text, nullable=False)
    claim_type: Mapped[str] = mapped_column(String(100), nullable=False)
    normalized_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    qualifier: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    entity_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    attribute_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    verification_status: Mapped[Optional[VerificationStatus]] = mapped_column(
        SQLEnum(VerificationStatus, native_enum=False),
        nullable=True,
    )
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[Optional[float]] = mapped_column(nullable=True)
    evidence_ids: Mapped[List[UUID]] = mapped_column(
        ARRAY(PG_UUID(as_uuid=True)), default=list, nullable=False
    )
    source_chunk_ids: Mapped[List[UUID]] = mapped_column(
        ARRAY(PG_UUID(as_uuid=True)), default=list, nullable=False
    )

    # Relationships
    analysis_run: Mapped["AnalysisRun"] = relationship(
        "AnalysisRun", back_populates="claims", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_claims_content", "content_id"),
        Index("ix_claims_run", "analysis_run_id"),
        Index("ix_claims_status", "verification_status"),
    )

    def __repr__(self) -> str:
        return f"<Claim(id={self.id}, type={self.claim_type}, status={self.verification_status})>"