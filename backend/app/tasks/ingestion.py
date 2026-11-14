from celery import shared_task
from uuid import UUID
import structlog

logger = structlog.get_logger()


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_source_task(self, source_id: str):
    """Extract text, chunk, embed, store."""
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings
    from app.services.ingestion import IngestionService
    
    # Create async engine for Celery worker
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async def _process():
        async with async_session() as db:
            service = IngestionService(db)
            await service.process_source(UUID(source_id))
    
    import asyncio
    try:
        asyncio.run(_process())
        logger.info("source_processed", source_id=source_id)
    except Exception as e:
        logger.error("source_processing_failed", source_id=source_id, error=str(e))
        raise self.retry(exc=e)
    finally:
        asyncio.run(engine.dispose())


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def generate_embeddings_task(self, chunk_ids: list):
    """Batch embedding generation for chunks."""
    # This would be used for batch processing
    pass
