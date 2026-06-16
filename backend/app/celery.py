# backend/app/worker/celery.py
"""
Celery application instance for the humflow worker.

This file is imported by the docker‑compose command:
    celery -A app.worker.celery_app worker …
"""

import os
from celery import Celery

# ----------------------------------------------------------------------
# Configuration – read from environment (with sensible defaults for local dev)
# ----------------------------------------------------------------------
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

# The Celery app object that the `-A` flag expects
celery_app = Celery(
    "humflow",                         # name of the application
    broker=REDIS_URL,
    backend=REDIS_URL,
    # Optional: make sure tasks are discovered automatically
    include=["app.worker.tasks"],      # adjust if you store tasks elsewhere
)

# ----------------------------------------------------------------------
# Optional Celery tuning (feel free to adapt)
# ----------------------------------------------------------------------
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Example: retry policy for broker connection errors
    broker_connection_retry_on_startup=True,
)
