from celery import shared_task
from uuid import UUID
import structlog

logger = structlog.get_logger()


@shared_task(bind=True, max_retries=2, default_retry_delay=60)
def analyze_content_task(self, content_id: str, org_id: str, user_id: str):
    """Full verification pipeline."""
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select
    from app.core.config import settings
    from app.models.content import ContentItem, ContentStatus
    from app.models.guideline import BrandGuideline
    from app.models.fact import ApprovedFact, FactVerificationStatus
    from app.services.verification import VerificationEngine
    from app.services.audit import AuditService
    
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async def _analyze():
        async with async_session() as db:
            # Get content
            content_result = await db.execute(
                select(ContentItem).where(ContentItem.id == UUID(content_id))
            )
            content = content_result.scalar_one_or_none()
            if not content:
                raise ValueError("Content not found")

            # Update status to analyzing
            content.status = ContentStatus.ANALYZING
            await db.commit()

            # Get active guidelines
            guidelines_result = await db.execute(
                select(BrandGuideline)
                .where(
                    BrandGuideline.org_id == UUID(org_id),
                    BrandGuideline.active == True,
                )
            )
            guidelines = guidelines_result.scalars().all()

            # Get approved facts
            facts_result = await db.execute(
                select(ApprovedFact)
                .where(
                    ApprovedFact.org_id == UUID(org_id),
                    ApprovedFact.verification_status == FactVerificationStatus.APPROVED,
                )
            )
            facts = facts_result.scalars().all()

            # Run verification engine
            engine = VerificationEngine(db)
            result = await engine.analyze_content(
                content_id=UUID(content_id),
                org_id=UUID(org_id),
                content_text=content.current_content,
                guidelines=list(guidelines),
                facts=list(facts),
                provider="Google Gemini" if settings.GEMINI_API_KEY else "Mock",
                model=settings.GEMINI_MODEL,
                prompt_version="v1.0",
            )

            # Log completion
            audit_service = AuditService(db)
            await audit_service.log(
                org_id=UUID(org_id),
                user_id=UUID(user_id),
                entity_type="analysis_run",
                entity_id=UUID(result["run_id"]),
                action="COMPLETED",
                old_value={"status": "RUNNING"},
                new_value={"status": "COMPLETED", "findings": len(result["findings"]), "claims": len(result["claims"])}
            )

            logger.info("analysis_completed", content_id=content_id, findings=len(result["findings"]))
    
    import asyncio
    try:
        asyncio.run(_analyze())
    except Exception as e:
        logger.error("analysis_failed", content_id=content_id, error=str(e))
        raise self.retry(exc=e)
    finally:
        asyncio.run(engine.dispose())
