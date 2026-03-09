from celery import Celery
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "health_assistant",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks.mr_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Europe/Istanbul",
    enable_utc=True,
    task_track_started=True,
    task_soft_time_limit=300,
    task_time_limit=360,
    # prefork yerine solo — Docker'da daha kararlı, ML modelleri için uygun
    worker_pool="solo",
)