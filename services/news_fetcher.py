"""
services/news_fetcher.py — Background news ingestion from NewsAPI.
Fetches top headlines, runs BERT classification, and stores approved articles.
"""
import asyncio
import logging
from datetime import datetime, timezone

from newsapi import NewsApiClient

from config import NEWS_API_KEY
from ai.predict import predict
from backend.database import news_collection

logger = logging.getLogger(__name__)


async def fetch_and_store_news() -> None:
    """
    Fetch 1 top headline from NewsAPI, classify with BERT,
    and store it if the model considers it real news.
    """
    if not NEWS_API_KEY:
        logger.info("NEWS_API_KEY not set — skipping fetch.")
        return

    try:
        newsapi = NewsApiClient(api_key=NEWS_API_KEY)
        top_headlines = newsapi.get_top_headlines(
            language="en", page_size=1,
        )
        articles = top_headlines.get("articles", [])
        if not articles:
            logger.info("No articles returned from NewsAPI.")
            return

        article = articles[0]
        title = article.get("title", "")
        description = article.get("description", "") or ""
        content_text = article.get("content", "") or description
        source_name = (
            article.get("source", {}).get("name", "NewsAPI")
        )

        if not title or not content_text or len(content_text) < 20:
            logger.info("Article content too short, skipping.")
            return

        # BERT classification
        full_text = f"{title} {content_text}"
        prediction = predict(full_text)
        if not prediction["is_real"]:
            logger.info(
                f"Rejected as fake ({prediction['confidence']}%): {title}",
            )
            return

        # NOTE: category is hardcoded to "World" — all auto-collected
        # articles get this category regardless of actual content.
        await news_collection.insert_one({
            "title": title,
            "content": content_text,
            "author_id": "system",
            "author_name": source_name,
            "category": "World",
            "is_real": True,
            "bert_confidence": prediction["confidence"],
            "fake_prob": prediction["fake_prob"],
            "real_prob": prediction["real_prob"],
            "upvotes": 0,
            "downvotes": 0,
            "is_auto_collected": True,
            "created_at": datetime.now(timezone.utc),
        })
        logger.info(f"Stored: {title}")

    except Exception as e:
        logger.error(f"News fetch error: {e}")


def run_fetch_news() -> None:
    """Synchronous wrapper for APScheduler — runs async fetch."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(fetch_and_store_news())
    finally:
        loop.close()
