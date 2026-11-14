from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "brandvault",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.ingestion",
        "app.tasks.analysis",
        "app.tasks.alerts",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour
    task_soft_time_limit=3300,
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=100,
    beat_schedule={
        "check-source-expiration": {
            "task": "app.tasks.alerts.check_source_expiration",
            "schedule": crontab(hour=0, minute=0),  # Daily at midnight
        },
    },
)

# Auto-discover tasks
celery_app.autodiscover_tasks()
