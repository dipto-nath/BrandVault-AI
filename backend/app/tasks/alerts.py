from celery import shared_task
from uuid import UUID
import structlog

logger = structlog.get_logger()


@shared_task
def check_source_expiration():
    """Daily: find expiring sources, notify owners."""
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select
    from datetime import datetime, timezone, timedelta
    from app.core.config import settings
    from app.models.source import Source, SourceStatus
    
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async def _check():
        async with async_session() as db:
            # Find sources expiring in 30 days
            cutoff = datetime.now(timezone.utc) + timedelta(days=30)
            result = await db.execute(
                select(Source)
                .where(
                    Source.document_status == SourceStatus.APPROVED,
                    Source.valid_to.isnot(None),
                    Source.valid_to <= cutoff,
                    Source.valid_to > datetime.now(timezone.utc),
                )
            )
            expiring_sources = result.scalars().all()
            
            for source in expiring_sources:
                logger.info("source_expiring_soon", source_id=str(source.id), expires_at=source.valid_to)
                # In production, send notification to source owner
    
    import asyncio
    asyncio.run(_check())
    asyncio.run(engine.dispose())


@shared_task
def scan_content_for_outdated_fact(fact_id: str):
    """When fact expires/changes: find affected approved content."""
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select
    from app.core.config import settings
    from app.models.fact import ApprovedFact
    from app.models.content import ContentItem, ContentStatus
    from app.models.claim import Claim
    
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async def _scan():
        async with async_session() as db:
            fact_result = await db.execute(
                select(ApprovedFact).where(ApprovedFact.id == UUID(fact_id))
            )
            fact = fact_result.scalar_one_or_none()
            if not fact:
                return
            
            # Find claims matching this fact's entity/attribute
            claims_result = await db.execute(
                select(Claim)
                .where(
                    Claim.entity_name == fact.entity_name,
                    Claim.attribute_name == fact.attribute_name,
                    Claim.verification_status == "SUPPORTED",
                )
            )
            claims = claims_result.scalars().all()
            
            for claim in claims:
                # Get content
                content_result = await db.execute(
                    select(ContentItem).where(ContentItem.id == claim.content_id)
                )
                content = content_result.scalar_one_or_none()
                if content and content.status == ContentStatus.APPROVED:
                    logger.info(
                        "approved_content_affected_by_fact_change",
                        content_id=str(content.id),
                        fact_id=fact_id,
                    )
                    # In production, create alert/notification
    
    import asyncio
    asyncio.run(_scan())
    asyncio.run(engine.dispose())
