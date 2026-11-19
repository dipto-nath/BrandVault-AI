import enum
from uuid import UUID, uuid4
from typing import Optional, Dict, List
from sqlalchemy import String, Text, Enum as SQLEnum, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.guideline import GuidelineCategory, Severity


class GuidelineTemplate(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "guideline_templates"

    industry: Mapped[str] = mapped_column(String(100), default="ALL", nullable=False)
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
    examples: Mapped[Optional[Dict[str, List[str]]]] = mapped_column(JSONB, nullable=True)

    __table_args__ = (
        Index("ix_guideline_templates_industry", "industry"),
    )
