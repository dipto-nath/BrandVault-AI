from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional
from sqlalchemy import String, Text, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB

from app.models.base import Base, TimestampMixin, UUIDMixin, OrgMixin


class PassportRecord(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "passport_records"

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
    passport_id: Mapped[str] = mapped_column(String(100), nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    findings_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    claims_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    decisions_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    audit_trail_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    generated_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    content: Mapped["ContentItem"] = relationship(lazy="selectin")
    generator: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[generated_by], lazy="selectin"
    )

    __table_args__ = (
        UniqueConstraint("content_id", "content_version_id", name="uq_passport_content_version"),
        Index("ix_passport_content", "content_id"),
    )

    def __repr__(self) -> str:
        return f"<PassportRecord(id={self.id}, passport_id={self.passport_id})>"