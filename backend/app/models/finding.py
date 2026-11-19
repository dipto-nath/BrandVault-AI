import enum
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional, List
from sqlalchemy import String, Text, Enum as SQLEnum, ForeignKey, Numeric, Index, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.base import Base, TimestampMixin, UUIDMixin, OrgMixin


class FindingType(str, enum.Enum):
    FACTUAL_CONTRADICTION = "FACTUAL_CONTRADICTION"
    UNSUPPORTED_CLAIM = "UNSUPPORTED_CLAIM"
    UNVERIFIED_CLAIM = "UNVERIFIED_CLAIM"
    TONE_VIOLATION = "TONE_VIOLATION"
    TERMINOLOGY_VIOLATION = "TERMINOLOGY_VIOLATION"
    GUIDELINE_VIOLATION = "GUIDELINE_VIOLATION"
    OUTDATED_SOURCE = "OUTDATED_SOURCE"
    CONFLICTING_SOURCES = "CONFLICTING_SOURCES"
    OTHER = "OTHER"


class EvidenceRelation(str, enum.Enum):
    SUPPORTS = "SUPPORTS"
    CONTRADICTS = "CONTRADICTS"
    RELATED = "RELATED"


class Severity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class Finding(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "findings"

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
    claim_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("claims.id", ondelete="SET NULL"),
        nullable=True,
    )
    finding_type: Mapped[FindingType] = mapped_column(
        SQLEnum(FindingType, native_enum=False),
        nullable=False,
    )
    severity: Mapped[Severity] = mapped_column(
        SQLEnum(Severity, native_enum=False),
        nullable=False,
    )
    rule_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("brand_guidelines.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_correction: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence: Mapped[float] = mapped_column(
        Numeric(3, 2), nullable=False
    )
    status: Mapped[str] = mapped_column(String(50), default="OPEN", nullable=False)
    resolved_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    override_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    evidence: Mapped[List["FindingEvidence"]] = relationship(
        "FindingEvidence", back_populates="finding", lazy="selectin", cascade="all, delete-orphan"
    )
    claim: Mapped[Optional["Claim"]] = relationship(
        "Claim", lazy="selectin"
    )
    rule: Mapped[Optional["BrandGuideline"]] = relationship(
        "BrandGuideline", lazy="selectin"
    )
    resolver: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[resolved_by], lazy="selectin"
    )

    __table_args__ = (
        Index("ix_findings_content", "content_id"),
        Index("ix_findings_run", "analysis_run_id"),
        Index("ix_findings_claim", "claim_id"),
        Index("ix_findings_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<Finding(id={self.id}, type={self.finding_type}, severity={self.severity})>"


class FindingEvidence(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "finding_evidence"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    finding_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("findings.id", ondelete="CASCADE"),
        nullable=False,
    )
    approved_fact_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("approved_facts.id", ondelete="SET NULL"),
        nullable=True,
    )
    source_chunk_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("source_chunks.id", ondelete="SET NULL"),
        nullable=True,
    )
    evidence_excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    relevance_explanation: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_relation: Mapped[EvidenceRelation] = mapped_column(
        SQLEnum(EvidenceRelation, native_enum=False),
        default=EvidenceRelation.SUPPORTS,
        nullable=False,
    )

    # Relationships
    finding: Mapped["Finding"] = relationship(
        "Finding", back_populates="evidence", lazy="selectin"
    )
    approved_fact: Mapped[Optional["ApprovedFact"]] = relationship(
        "ApprovedFact", lazy="selectin"
    )
    source_chunk: Mapped[Optional["SourceChunk"]] = relationship(
        "SourceChunk", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_evidence_finding", "finding_id"),
        Index("ix_evidence_fact", "approved_fact_id"),
        Index("ix_evidence_chunk", "source_chunk_id"),
    )

    def __repr__(self) -> str:
        return f"<FindingEvidence(id={self.id}, finding_id={self.finding_id}, relation={self.evidence_relation})>"