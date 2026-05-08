"""News aggregation: pulls institutional + macro + tech news.
Sources: yfinance (Yahoo) — keyless. Optionally NewsAPI when NEWSAPI_KEY in env.
"""
import os
import httpx
from typing import List, Dict, Any
from .market import get_news_for
from .cache import cache

INSTITUTIONS = ["GS", "MS", "BAC"]
MACRO_TICKERS = ["SPX", "VIX", "DXY", "GOLD", "SILVER", "TNX"]
TECH_TICKERS = ["AAPL", "MSFT", "NVDA", "META", "AMD", "ASML", "TSM"]


def get_combined_news(category: str = "all", limit: int = 30) -> List[Dict[str, Any]]:
    cache_key = f"combined_news:{category}:{limit}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    if category == "institutional":
        tickers = INSTITUTIONS
    elif category == "tech":
        tickers = TECH_TICKERS
    elif category == "macro":
        tickers = MACRO_TICKERS
    else:
        tickers = INSTITUTIONS + MACRO_TICKERS + TECH_TICKERS

    seen = set()
    items: List[Dict[str, Any]] = []
    for tkr in tickers:
        for news in get_news_for(tkr, limit=8):
            key = news["title"]
            if key in seen:
                continue
            seen.add(key)
            news["category"] = _classify(tkr)
            items.append(news)

    items.sort(key=lambda n: n.get("published_at", ""), reverse=True)
    items = items[:limit]
    cache.set(cache_key, items, ttl=300)
    return items


def _classify(symbol: str) -> str:
    if symbol in INSTITUTIONS:
        return "institutional"
    if symbol in TECH_TICKERS:
        return "tech"
    return "macro"


async def get_newsapi_headlines(query: str = "stocks OR fed OR inflation") -> List[Dict[str, Any]]:
    """Optional NewsAPI integration when NEWSAPI_KEY is provided."""
    key = os.environ.get("NEWSAPI_KEY")
    if not key:
        return []
    cache_key = f"newsapi:{query}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                "https://newsapi.org/v2/everything",
                params={
                    "q": query,
                    "sortBy": "publishedAt",
                    "language": "en",
                    "pageSize": 30,
                    "apiKey": key,
                },
            )
            r.raise_for_status()
            data = r.json()
            articles = [
                {
                    "title": a["title"],
                    "publisher": a.get("source", {}).get("name", "NewsAPI"),
                    "url": a.get("url", "#"),
                    "published_at": a.get("publishedAt", ""),
                    "tag": "MACRO",
                    "category": "macro",
                }
                for a in data.get("articles", [])
            ]
            cache.set(cache_key, articles, ttl=600)
            return articles
    except Exception:
        return []
