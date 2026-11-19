from datetime import date
from uuid import UUID
from sqlalchemy import Integer, Date, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.base import Base, TimestampMixin, UUIDMixin, OrgMixin


class UsageCounter(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "usage_counters"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    usage_date: Mapped[date] = mapped_column(Date, nullable=False)
    llm_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    embedding_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    uploads: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (
        UniqueConstraint("org_id", "usage_date", name="uq_org_usage_date"),
        Index("ix_usage_org_date", "org_id", "usage_date"),
    )
