"""
services/fact_checker.py — Cross-reference news via NewsAPI and DuckDuckGo.
"""
import logging
from duckduckgo_search import DDGS
from newsapi import NewsApiClient
from config import NEWS_API_KEY

logger = logging.getLogger(__name__)


def cross_reference_news(title: str) -> dict:
    """
    Search NewsAPI and DuckDuckGo for matching articles.

    Returns:
        is_verified (bool): True if at least one live article was found.
        source (str): Name of the first source found, if any.
        articles (list): The list of matching articles.
    """
    # 1. Try NewsAPI first for high reliability
    if NEWS_API_KEY:
        try:
            newsapi = NewsApiClient(api_key=NEWS_API_KEY)
            results = newsapi.get_everything(
                q=title, language="en", page_size=3,
            )
            if results and results.get("totalResults", 0) > 0:
                articles = results.get("articles", [])
                if articles:
                    return {
                        "is_verified": True,
                        "articles": articles[:3],
                        "source": articles[0]
                        .get("source", {})
                        .get("name", "NewsAPI"),
                    }
        except Exception as e:
            logger.warning(f"NewsAPI error: {e}")

    # 2. Fallback to DuckDuckGo Search
    try:
        with DDGS() as ddgs:
            results = list(ddgs.news(title, max_results=3))

        if results:
            return {
                "is_verified": True,
                "articles": results,
                "source": results[0].get("source", "Web Search"),
            }

        return {"is_verified": False, "articles": [], "source": None}
    except Exception as e:
        logger.warning(f"DuckDuckGo error: {e}")
        return {"is_verified": False, "articles": [], "source": None}


def is_corroborated(title: str) -> bool:
    """Return True if at least one external source corroborates the title."""
    return cross_reference_news(title).get("is_verified", False)
