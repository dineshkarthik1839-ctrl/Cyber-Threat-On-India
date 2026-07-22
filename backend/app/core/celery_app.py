import os
from celery import Celery

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "ictip_worker",
    broker=redis_url,
    backend=redis_url
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    # Worker configuration
    worker_prefetch_multiplier=1,
    task_acks_late=True
)

@celery_app.task(bind=True, max_retries=3)
def process_background_threat(self, threat_data: dict):
    """
    Example background task for heavy processing.
    In the future, ML model inference will be dispatched here.
    """
    import logging
    logger = logging.getLogger(__name__)
    try:
        logger.info(f"Processing background threat: {threat_data.get('id')}")
        # Processing logic goes here
        return {"status": "success", "threat_id": threat_data.get('id')}
    except Exception as exc:
        logger.error(f"Error processing background threat: {exc}")
        raise self.retry(exc=exc, countdown=60)
