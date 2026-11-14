import enum
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional
from sqlalchemy import String, Text, Enum as SQLEnum, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.base import Base, TimestampMixin, UUIDMixin, OrgMixin


class ContentStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ANALYZING = "ANALYZING"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"


class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ContentType(str, enum.Enum):
    SOCIAL_MEDIA_POST = "SOCIAL_MEDIA_POST"
    ADVERTISEMENT = "ADVERTISEMENT"
    PRODUCT_DESCRIPTION = "PRODUCT_DESCRIPTION"
    WEBSITE_COPY = "WEBSITE_COPY"
    EMAIL_CAMPAIGN = "EMAIL_CAMPAIGN"
    PRESS_RELEASE = "PRESS_RELEASE"
    OTHER = "OTHER"


class Channel(str, enum.Enum):
    WEBSITE = "WEBSITE"
    INSTAGRAM = "INSTAGRAM"
    LINKEDIN = "LINKEDIN"
    EMAIL = "EMAIL"
    ADVERTISING = "ADVERTISING"
    OTHER = "OTHER"


class ContentItem(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "content_items"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content_type: Mapped[ContentType] = mapped_column(
        SQLEnum(ContentType, native_enum=False),
        nullable=False,
    )
    channel: Mapped[Channel] = mapped_column(
        SQLEnum(Channel, native_enum=False),
        nullable=False,
    )
    original_content: Mapped[str] = mapped_column(Text, nullable=False)
    current_content: Mapped[str] = mapped_column(Text, nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    status: Mapped[ContentStatus] = mapped_column(
        SQLEnum(ContentStatus, native_enum=False),
        default=ContentStatus.DRAFT,
        nullable=False,
    )
    risk_level: Mapped[Optional[RiskLevel]] = mapped_column(
        SQLEnum(RiskLevel, native_enum=False),
        nullable=True,
    )
    product_context: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    campaign_context: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    locale: Mapped[str] = mappedColumn(String(10), default="en", nullable=False)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewer_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    rejected_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    versions: Mapped[List["ContentVersion"]] = relationship(
        "ContentVersion", back_populates="content", lazy="selectin", cascade="all, delete-orphan"
    )
    runs: Mapped[List["AnalysisRun"]] = relationship(
        "AnalysisRun", back_populates="content", lazy="selectin"
    )
    creator: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[created_by], lazy="selectin"
    )
    reviewer: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[reviewer_id], lazy="selectin"
    )

    __table_args__ = (
        Index("ix_content_org_status", "org_id", "status"),
        Index("ix_content_org_created", "org_id", "created_at"),
        Index("ix_content_hash", "content_hash"),
    )

    def __repr__(self) -> str:
        return f"<ContentItem(id={self.id}, title={self.title}, status={self.status})>"


class ContentVersion(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "content_versions"

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
    version_number: Mapped[int] = mapped_column(nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    change_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    content: Mapped["ContentItem"] = relationship(
        "ContentItem", back_populates="versions", lazy="selectin"
    )
    creator: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[created_by], lazy="selectin"
    )

    __table_args__ = (
        UniqueConstraint("content_id", "version_number", name="uq_version_content_num"),
        Index("ix_versions_content", "content_id"),
    )

    def __repr__(self) -> str:
        return f"<ContentVersion(content_id={self.content_id}, version={self.version_number})>"