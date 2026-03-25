"""
services/scheduler.py — Background job scheduling via APScheduler.
Only initializes the scheduler and registers jobs. Business logic
lives in the individual job modules (e.g. news_fetcher.py).
"""
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from services.news_fetcher import run_fetch_news

logger = logging.getLogger(__name__)

_scheduler = None


def start_scheduler() -> None:
    """Start the background scheduler (24h news fetch cycle)."""
    global _scheduler
    if _scheduler is not None:
        return

    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        run_fetch_news, "interval", hours=24, id="news_fetcher",
    )
    _scheduler.start()
    logger.info("Scheduler started — fetching news every 24 hours.")


def stop_scheduler() -> None:
    """Stop the background scheduler."""
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Scheduler stopped.")
