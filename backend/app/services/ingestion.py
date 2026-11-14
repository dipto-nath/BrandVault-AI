from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Optional, List
from datetime import datetime
import fitz  # PyMuPDF
import docx
import tiktoken
import structlog

from app.models.source import Source, SourceChunk, SourceStatus
from app.core.database import db_manager
from app.utils.document_parser import extract_text_from_pdf, extract_text_from_docx, chunk_text
from app.agents.embeddings import get_embeddings

logger = structlog.get_logger()


class IngestionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def process_source(self, source_id: UUID, valid_from: Optional[datetime] = None, valid_to: Optional[datetime] = None) -> None:
        """Process uploaded source: extract text, chunk, embed, store."""
        # Get source
        result = await self.db.execute(
            select(Source).where(Source.id == source_id)
        )
        source = result.scalar_one_or_none()
        if not source:
            logger.error("source_not_found", source_id=str(source_id))
            return

        try:
            # Extract text based on mime type
            if source.mime_type == "application/pdf":
                text, page_count = await extract_text_from_pdf(source.storage_path)
            elif source.mime_type in [
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/msword",
            ]:
                text, page_count = await extract_text_from_docx(source.storage_path)
            elif source.mime_type == "text/plain":
                with open(source.storage_path, "r") as f:
                    text = f.read()
                page_count = 1
            else:
                raise ValueError(f"Unsupported mime type: {source.mime_type}")

            # Update source with extracted text
            source.extracted_text = text
            source.page_count = page_count
            source.document_status = SourceStatus.PENDING_REVIEW
            if valid_from:
                source.valid_from = valid_from
            if valid_to:
                source.valid_to = valid_to

            # Chunk text
            chunks = chunk_text(text, chunk_size=500, overlap=50)
            source.chunk_count = len(chunks)

            # Generate embeddings for chunks
            chunk_texts = [c["text"] for c in chunks]
            embeddings = await get_embeddings(chunk_texts)

            # Store chunks with embeddings
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                source_chunk = SourceChunk(
                    source_id=source.id,
                    org_id=source.org_id,
                    chunk_index=i,
                    page_start=chunk.get("page_start"),
                    page_end=chunk.get("page_end"),
                    char_start=chunk.get("char_start"),
                    char_end=chunk.get("char_end"),
                    text=chunk["text"],
                    token_count=chunk.get("token_count"),
                    embedding=embedding,
                )
                self.db.add(source_chunk)

            await self.db.commit()
            logger.info("source_processed", source_id=str(source_id), chunks=len(chunks))

        except Exception as e:
            logger.error("source_processing_failed", source_id=str(source_id), error=str(e))
            source.document_status = SourceStatus.FAILED
            source.extraction_error = str(e)
            await self.db.commit()
            raise

    async def approve_source(self, source_id: UUID, user_id: UUID) -> Source:
        """Approve source for use."""
        from datetime import datetime, timezone
        result = await self.db.execute(
            select(Source).where(Source.id == source_id)
        )
        source = result.scalar_one_or_none()
        if not source:
            raise ValueError("Source not found")

        source.document_status = SourceStatus.APPROVED
        source.approved_at = datetime.now(timezone.utc)
        source.approved_by = user_id
        source.version += 1
        await self.db.commit()
        await self.db.refresh(source)
        return source

    async def get_source_with_chunks(self, source_id: UUID) -> Optional[Source]:
        """Get source with all chunks loaded."""
        result = await self.db.execute(
            select(Source).where(Source.id == source_id)
        )
        return result.scalar_one_or_none()


from sqlalchemy import select
