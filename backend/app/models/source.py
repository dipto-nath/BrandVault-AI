import enum
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional, List
from sqlalchemy import String, Text, Enum as SQLEnum, ForeignKey, Integer, BigInteger, Index, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from pgvector.sqlalchemy import Vector

from app.models.base import Base, TimestampMixin, UUIDMixin, OrgMixin


class SourceStatus(str, enum.Enum):
    UPLOADING = "UPLOADING"
    EXTRACTING = "EXTRACTING"
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"


class Source(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "sources"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    source_name: Mapped[str] = mapped_column(String(255), nullable=False)
    document_status: Mapped[SourceStatus] = mapped_column(
        SQLEnum(SourceStatus, native_enum=False),
        default=SourceStatus.UPLOADING,
        nullable=False,
    )
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extraction_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    page_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    chunk_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    uploaded_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    approved_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    valid_from: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    valid_to: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    doc_metadata: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)

    # Relationships
    chunks: Mapped[List["SourceChunk"]] = relationship(
        "SourceChunk", back_populates="source", lazy="selectin", cascade="all, delete-orphan"
    )
    uploader: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[uploaded_by], lazy="selectin"
    )
    approver: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[approved_by], lazy="selectin"
    )

    __table_args__ = (
        Index("ix_sources_org_status", "org_id", "document_status"),
        Index(
            "ix_sources_validity",
            "org_id",
            "valid_from",
            "valid_to",
            postgresql_where=(
                "valid_from IS NOT NULL OR valid_to IS NOT NULL"
            ),
        ),
    )

    def __repr__(self) -> str:
        return f"<Source(id={self.id}, name={self.source_name}, status={self.document_status})>"


class SourceChunk(Base, UUIDMixin, TimestampMixin, OrgMixin):
    __tablename__ = "source_chunks"

    org_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("sources.id", ondelete="CASCADE"),
        nullable=False,
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    page_start: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    page_end: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    char_start: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    char_end: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    embedding: Mapped[Optional[List[float]]] = mapped_column(
        Vector(1536), nullable=True
    )
    chunk_metadata: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)

    # Relationships
    source: Mapped["Source"] = relationship(
        "Source", back_populates="chunks", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_chunks_source", "source_id"),
        Index("ix_chunks_org", "org_id"),
        Index(
            "ix_chunks_embedding",
            "embedding",
            postgresql_using="ivfflat",
            postgresql_with={"lists": 100},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    def __repr__(self) -> str:
        return f"<SourceChunk(id={self.id}, source_id={self.source_id}, index={self.chunk_index})>"