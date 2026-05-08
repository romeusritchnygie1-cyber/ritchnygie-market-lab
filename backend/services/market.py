"""Market data service using yfinance (free, no API key)."""
import yfinance as yf
import pandas as pd
from typing import Dict, List, Any
from .cache import cache

# Symbol map: friendly_name -> yfinance symbol
SYMBOL_MAP: Dict[str, str] = {
    # S&P 500 (CFD price tracks ^GSPC)
    "SPX": "^GSPC",
    "SPY": "SPY",
    # Volatility
    "VIX": "^VIX",
    # Dollar Index
    "DXY": "DX-Y.NYB",
    # Treasury yields
    "TNX": "^TNX",     # 10Y Yield
    "FVX": "^FVX",     # 5Y Yield
    # Commodities
    "GOLD": "GC=F",
    "SILVER": "SI=F",
    # Indices
    "DJI": "^DJI",
    # Mag 7
    "AAPL": "AAPL",
    "MSFT": "MSFT",
    "GOOGL": "GOOGL",
    "AMZN": "AMZN",
    "META": "META",
    "NVDA": "NVDA",
    "TSLA": "TSLA",
    # Other watchlist
    "AMD": "AMD",
    "ASML": "ASML",
    "TSM": "TSM",
    # Big banks (institutional sentiment)
    "GS": "GS",
    "MS": "MS",
    "BAC": "BAC",
}

# Display labels
LABELS: Dict[str, str] = {
    "SPX": "S&P 500",
    "SPY": "SPY ETF",
    "VIX": "VIX",
    "DXY": "DXY",
    "TNX": "10Y Yield",
    "FVX": "5Y Yield",
    "GOLD": "Gold",
    "SILVER": "Silver",
    "DJI": "Dow Jones",
    "AAPL": "Apple",
    "MSFT": "Microsoft",
    "GOOGL": "Alphabet",
    "AMZN": "Amazon",
    "META": "Meta",
    "NVDA": "Nvidia",
    "TSLA": "Tesla",
    "AMD": "AMD",
    "ASML": "ASML",
    "TSM": "TSMC",
    "GS": "Goldman Sachs",
    "MS": "Morgan Stanley",
    "BAC": "Bank of America",
}


def _quote_from_history(symbol: str) -> Dict[str, Any]:
    """Fetch latest OHLC + previous close for a single yfinance symbol."""
    yf_symbol = SYMBOL_MAP.get(symbol, symbol)
    cache_key = f"quote:{yf_symbol}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        ticker = yf.Ticker(yf_symbol)
        # Use 5d history for prev_close + intraday
        hist = ticker.history(period="5d", interval="1d", auto_adjust=False)
        if hist.empty or len(hist) < 1:
            raise ValueError("no data")

        last = hist.iloc[-1]
        prev_close = float(hist.iloc[-2]["Close"]) if len(hist) > 1 else float(last["Open"])
        current = float(last["Close"])
        change = current - prev_close
        change_pct = (change / prev_close) * 100 if prev_close else 0.0

        result = {
            "symbol": symbol,
            "label": LABELS.get(symbol, symbol),
            "price": round(current, 4),
            "open": round(float(last["Open"]), 4),
            "high": round(float(last["High"]), 4),
            "low": round(float(last["Low"]), 4),
            "prev_close": round(prev_close, 4),
            "change": round(change, 4),
            "change_pct": round(change_pct, 4),
            "volume": int(last["Volume"]) if not pd.isna(last["Volume"]) else 0,
        }
        cache.set(cache_key, result, ttl=30)
        return result
    except Exception as e:
        return {
            "symbol": symbol,
            "label": LABELS.get(symbol, symbol),
            "price": None,
            "error": str(e),
            "change": 0,
            "change_pct": 0,
        }


def get_quote(symbol: str) -> Dict[str, Any]:
    return _quote_from_history(symbol)


def get_quotes(symbols: List[str]) -> List[Dict[str, Any]]:
    return [_quote_from_history(s) for s in symbols]


def get_history(symbol: str, period: str = "3mo", interval: str = "1d") -> pd.DataFrame:
    """Get OHLC history dataframe for a symbol."""
    yf_symbol = SYMBOL_MAP.get(symbol, symbol)
    cache_key = f"hist:{yf_symbol}:{period}:{interval}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    ticker = yf.Ticker(yf_symbol)
    hist = ticker.history(period=period, interval=interval, auto_adjust=False)
    cache.set(cache_key, hist, ttl=120)
    return hist


def get_news_for(symbol: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Fetch news for a symbol via yfinance (Yahoo Finance)."""
    yf_symbol = SYMBOL_MAP.get(symbol, symbol)
    cache_key = f"news:{yf_symbol}"
    cached = cache.get(cache_key)
    if cached:
        return cached[:limit]
    try:
        ticker = yf.Ticker(yf_symbol)
        raw = ticker.news or []
        items = []
        for item in raw[:limit]:
            content = item.get("content") or item
            title = content.get("title") or item.get("title")
            if not title:
                continue
            provider = (
                content.get("provider", {}).get("displayName")
                if isinstance(content.get("provider"), dict)
                else item.get("publisher", "Yahoo Finance")
            )
            url = (
                content.get("canonicalUrl", {}).get("url")
                if isinstance(content.get("canonicalUrl"), dict)
                else item.get("link", "#")
            )
            pub_date = content.get("pubDate") or item.get("providerPublishTime")
            if isinstance(pub_date, (int, float)):
                pub_date = pd.to_datetime(pub_date, unit="s").isoformat()
            items.append({
                "title": title,
                "publisher": provider or "Yahoo Finance",
                "url": url or "#",
                "published_at": str(pub_date) if pub_date else "",
                "tag": symbol,
            })
        cache.set(cache_key, items, ttl=600)
        return items
    except Exception:
        return []
