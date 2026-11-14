import enum
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional, Dict, List
from sqlalchemy import String, Text, Enum as SQLEnum, ForeignKey, Integer, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB

from app.models.base import Base, TimestampMixin, UUIDMixin, OrgMixin


class GuidelineCategory(str, enum.Enum):
    TONE = "TONE"
    TERMINOLOGY = "TERMINOLOGY"
    CLAIMS = "CLAIMS"
    FORMATTING = "FORMATTING"
    LEGAL = "LEGAL"
    POSITIONING = "POSITIONING"
    OTHER = "OTHER"


class Severity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class BrandGuideline(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "brand_guidelines"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    rule_code: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[GuidelineCategory] = mapped_column(
        SQLEnum(GuidelineCategory, native_enum=False),
        nullable=False,
    )
    severity: Mapped[Severity] = mapped_column(
        SQLEnum(Severity, native_enum=False),
        default=Severity.MEDIUM,
        nullable=False,
    )
    examples: Mapped[Optional[Dict[str, List[str]]]] = mapped_column(
        JSONB, nullable=True
    )
    pattern: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    replacement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    creator: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[created_by], lazy="selectin"
    )

    __table_args__ = (
        UniqueConstraint("org_id", "rule_code", name="uq_guideline_org_code"),
        Index("ix_guidelines_org_active", "org_id", "active"),
    )

    def __repr__(self) -> str:
        return f"<BrandGuideline(id={self.id}, code={self.rule_code}, category={self.category})>"