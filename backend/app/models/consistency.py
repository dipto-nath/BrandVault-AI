import enum
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional, List
from sqlalchemy import String, Text, Enum as SQLEnum, ForeignKey, Index, UniqueConstraint, DateTime, JSON, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.base import Base, TimestampMixin, UUIDMixin, OrgMixin
from app.models.finding import Severity


class ConsistencyCheckLanguage(str, enum.Enum):
    HI = "hi"
    BN = "bn"
    EN = "en"


class ConsistencyCheckStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ConsistencyFindingType(str, enum.Enum):
    NUMERIC_MISMATCH = "NUMERIC_MISMATCH"
    UNIT_MISMATCH = "UNIT_MISMATCH"
    DATE_MISMATCH = "DATE_MISMATCH"
    PRODUCT_NAME_MISMATCH = "PRODUCT_NAME_MISMATCH"
    VERSION_MISMATCH = "VERSION_MISMATCH"
    TERMINOLOGY_MISMATCH = "TERMINOLOGY_MISMATCH"
    UNSUPPORTED_CLAIM = "UNSUPPORTED_CLAIM"
    UNVERIFIED_CLAIM = "UNVERIFIED_CLAIM"


class ConsistencyFindingStatus(str, enum.Enum):
    OPEN = "OPEN"
    CONFIRMED = "CONFIRMED"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    NEEDS_CONTEXT = "NEEDS_CONTEXT"
    RESOLVED = "RESOLVED"


class ConsistencyCheckSubmission(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "consistency_check_submissions"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=False,
    )
    language: Mapped["ConsistencyCheckLanguage"] = mapped_column(
        SQLEnum(ConsistencyCheckLanguage, native_enum=False),
        nullable=False,
    )
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_text: Mapped[str] = mapped_column(Text, nullable=False)
    fact_set_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("approved_fact_sets.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped["ConsistencyCheckStatus"] = mapped_column(
        SQLEnum(ConsistencyCheckStatus, native_enum=False),
        default=ConsistencyCheckStatus.QUEUED,
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    fact_set: Mapped["ApprovedFactSet"] = relationship(
        "ApprovedFactSet", lazy="selectin"
    )
    creator: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[user_id], lazy="selectin"
    )
    job: Mapped[Optional["ConsistencyCheckJob"]] = relationship(
        "ConsistencyCheckJob", back_populates="submission", lazy="selectin", uselist=False
    )

    __table_args__ = (
        Index("ix_consistency_submissions_org", "org_id"),
        Index("ix_consistency_submissions_status", "status"),
        Index("ix_consistency_submissions_fact_set", "fact_set_id"),
    )

    def __repr__(self) -> str:
        return f"<ConsistencyCheckSubmission(id={self.id}, language={self.language}, status={self.status})>"




class ConsistencyCheckJob(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "consistency_check_jobs"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    submission_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("consistency_check_submissions.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped["ConsistencyCheckStatus"] = mapped_column(
        SQLEnum(ConsistencyCheckStatus, native_enum=False),
        default=ConsistencyCheckStatus.QUEUED,
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    submission: Mapped["ConsistencyCheckSubmission"] = relationship(
        "ConsistencyCheckSubmission", back_populates="job", lazy="selectin"
    )
    findings: Mapped[List["ConsistencyFinding"]] = relationship(
        "ConsistencyFinding", back_populates="job", lazy="selectin", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_consistency_jobs_submission", "submission_id"),
        Index("ix_consistency_jobs_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<ConsistencyCheckJob(id={self.id}, status={self.status})>"


class ConsistencyFinding(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "consistency_findings"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    job_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("consistency_check_jobs.id", ondelete="CASCADE"),
        nullable=False,
    )
    claim_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("claims.id", ondelete="SET NULL"),
        nullable=True,
    )
    finding_type: Mapped["ConsistencyFindingType"] = mapped_column(
        SQLEnum(ConsistencyFindingType, native_enum=False),
        nullable=False,
    )
    severity: Mapped["Severity"] = mapped_column(
        SQLEnum(Severity, native_enum=False),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    localized_claim: Mapped[str] = mapped_column(Text, nullable=False)
    back_translation: Mapped[str] = mapped_column(Text, nullable=False)
    approved_fact: Mapped[str] = mapped_column(Text, nullable=False)
    approved_fact_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("approved_facts.id", ondelete="CASCADE"),
        nullable=False,
    )
    evidence: Mapped[dict] = mapped_column(JSON, nullable=False)
    confidence: Mapped[float] = mapped_column(
        Numeric(3, 2), nullable=False
    )
    status: Mapped["ConsistencyFindingStatus"] = mapped_column(
        SQLEnum(ConsistencyFindingStatus, native_enum=False),
        default=ConsistencyFindingStatus.OPEN,
        nullable=False,
    )
    reviewer_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decided_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    job: Mapped["ConsistencyCheckJob"] = relationship(
        "ConsistencyCheckJob", back_populates="findings", lazy="selectin"
    )
    claim: Mapped[Optional["Claim"]] = relationship(
        "Claim", lazy="selectin"
    )
    approved_fact: Mapped["ApprovedFact"] = relationship(
        "ApprovedFact", lazy="selectin"
    )
    reviewer: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[reviewer_id], lazy="selectin"
    )

    __table_args__ = (
        Index("ix_consistency_findings_job", "job_id"),
        Index("ix_consistency_findings_claim", "claim_id"),
        Index("ix_consistency_findings_type", "finding_type"),
        Index("ix_consistency_findings_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<ConsistencyFinding(id={self.id}, type={self.finding_type}, severity={self.severity})>"


class ApprovedFactSet(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "approved_fact_sets"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    brand_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("brands.id", ondelete="SET NULL"),
        nullable=True,
    )
    product_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
    )
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="DRAFT", nullable=False
    )
    created_by: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=False,
    )

    # Relationships
    brand: Mapped[Optional["Brand"]] = relationship(
        "Brand", lazy="selectin"
    )
    product: Mapped[Optional["Product"]] = relationship(
        "Product", lazy="selectin"
    )
    creator: Mapped["User"] = relationship(
        "User", foreign_keys=[created_by], lazy="selectin"
    )
    facts: Mapped[List["ApprovedFact"]] = relationship(
        "ApprovedFact", back_populates="fact_set", lazy="selectin"
    )
    submissions: Mapped[List["ConsistencyCheckSubmission"]] = relationship(
        "ConsistencyCheckSubmission", back_populates="fact_set", lazy="selectin"
    )

    __table_args__ = (
        UniqueConstraint("org_id", "version", name="uq_factset_org_version"),
        Index("ix_factsets_org_status", "org_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<ApprovedFactSet(id={self.id}, version={self.version}, status={self.status})>"


class GlossaryTerm(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "glossary_terms"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    term_en: Mapped[str] = mapped_column(String(200), nullable=False)
    term_hi: Mapped[str] = mapped_column(String(200), nullable=False)
    term_bn: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    protected: Mapped[bool] = mapped_column(default=False, nullable=False)
    valid_from: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    valid_to: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        Index("ix_glossary_org_en", "org_id", "term_en"),
        Index("ix_glossary_org_hi", "org_id", "term_hi"),
        Index("ix_glossary_org_bn", "org_id", "term_bn"),
    )

    def __repr__(self) -> str:
        return f"<GlossaryTerm(id={self.id}, en={self.term_en}, hi={self.term_hi}, bn={self.term_bn})>"


class EvaluationCase(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "evaluation_cases"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    language: Mapped["ConsistencyCheckLanguage"] = mapped_column(
        SQLEnum(ConsistencyCheckLanguage, native_enum=False),
        nullable=False,
    )
    input_text: Mapped[str] = mapped_column(Text, nullable=False)
    expected_labels: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    dataset_version: Mapped[str] = mapped_column(String(50), nullable=False)

    __table_args__ = (
        Index("ix_eval_cases_lang", "language"),
        Index("ix_eval_cases_dataset", "dataset_version"),
    )

    def __repr__(self) -> str:
        return f"<EvaluationCase(id={self.id}, lang={self.language})>"
