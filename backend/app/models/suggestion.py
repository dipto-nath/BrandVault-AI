import enum
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import List, Optional
from sqlalchemy import String, Text, Enum as SQLEnum, ForeignKey, Index, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.base import Base, TimestampMixin, UUIDMixin, OrgMixin


class SuggestionStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class GuidelineSuggestion(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "guideline_suggestions"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    guideline_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("brand_guidelines.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    suggested_change: Mapped[str] = mapped_column(Text, nullable=False)
    supporting_feedback_ids: Mapped[List[UUID]] = mapped_column(
        ARRAY(PG_UUID(as_uuid=True)), default=list, nullable=False
    )
    status: Mapped[SuggestionStatus] = mapped_column(
        SQLEnum(SuggestionStatus, native_enum=False),
        default=SuggestionStatus.PENDING,
        nullable=False,
    )
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    guideline: Mapped["BrandGuideline"] = relationship(lazy="selectin")
    creator: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[created_by], lazy="selectin"
    )
    reviewer: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[reviewed_by], lazy="selectin"
    )

    __table_args__ = (
        Index("ix_suggestions_org", "org_id"),
        Index("ix_suggestions_guideline", "guideline_id"),
    )

    def __repr__(self) -> str:
        return f"<GuidelineSuggestion(id={self.id}, guideline_id={self.guideline_id}, status={self.status})>"