import enum
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional
from sqlalchemy import String, Text, Enum as SQLEnum, ForeignKey, Index, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.base import Base, TimestampMixin, UUIDMixin, OrgMixin


class ReviewDecisionType(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"


# Alias for backward compatibility
ReviewDecisionEnum = ReviewDecisionType


class FeedbackType(str, enum.Enum):
    ACCEPTED = "ACCEPTED"
    OVERRIDDEN = "OVERRIDDEN"
    EDITED_CORRECTION = "EDITED_CORRECTION"
    REJECTED_CORRECTION = "REJECTED_CORRECTION"
    MARKED_AMBIGUOUS = "MARKED_AMBIGUOUS"


class ReviewDecision(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "review_decisions"

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
    reviewer_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    decision: Mapped[ReviewDecisionType] = mapped_column(
        SQLEnum(ReviewDecisionType, native_enum=False),
        nullable=False,
    )
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    content: Mapped["ContentItem"] = relationship(lazy="selectin")
    reviewer: Mapped["User"] = relationship(
        "User", foreign_keys=[reviewer_id], lazy="selectin"
    )

    __table_args__ = (
        Index("ix_reviews_content", "content_id"),
        Index("ix_reviews_reviewer", "reviewer_id"),
    )

    def __repr__(self) -> str:
        return f"<ReviewDecision(id={self.id}, content_id={self.content_id}, decision={self.decision})>"


class FindingFeedback(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "finding_feedback"

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
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    feedback_type: Mapped[FeedbackType] = mapped_column(
        SQLEnum(FeedbackType, native_enum=False),
        nullable=False,
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    finding: Mapped["Finding"] = relationship(lazy="selectin")
    user: Mapped["User"] = relationship(
        "User", foreign_keys=[user_id], lazy="selectin"
    )

    __table_args__ = (
        Index("ix_feedback_finding", "finding_id"),
    )

    def __repr__(self) -> str:
        return f"<FindingFeedback(id={self.id}, finding_id={self.finding_id}, type={self.feedback_type})>"