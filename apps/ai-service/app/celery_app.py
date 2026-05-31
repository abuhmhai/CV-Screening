import os

from celery import Celery

broker_url = os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://redis:6379/0"))
backend_url = os.getenv("CELERY_RESULT_BACKEND", broker_url)

celery_app = Celery("ai_screening_worker", broker=broker_url, backend=backend_url)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

celery_app.autodiscover_tasks(["app"])
