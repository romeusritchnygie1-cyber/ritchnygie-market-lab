"""FRED integration for Federal Reserve & macro indicators.
Uses public CSV endpoints (no key required) for resilience, with optional
api_key support if FRED_API_KEY is set.
"""
import os
import httpx
from typing import Dict, Any, Optional
from .cache import cache

# Series we surface
FRED_SERIES = {
    "FEDFUNDS": "Federal Funds Rate",
    "DGS10": "10-Year Treasury Yield",
    "DGS2": "2-Year Treasury Yield",
    "CPIAUCSL": "CPI (All Urban Consumers)",
    "UNRATE": "Unemployment Rate",
    "DFF": "Effective Fed Funds Rate (Daily)",
}


async def fetch_series(series_id: str) -> Optional[Dict[str, Any]]:
    """Latest value for a FRED series. Tries API key endpoint first, falls back
    to public CSV (fredgraph)."""
    cache_key = f"fred:{series_id}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    key = os.environ.get("FRED_API_KEY")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            if key:
                r = await client.get(
                    "https://api.stlouisfed.org/fred/series/observations",
                    params={
                        "series_id": series_id,
                        "api_key": key,
                        "file_type": "json",
                        "sort_order": "desc",
                        "limit": 2,
                    },
                )
                r.raise_for_status()
                obs = r.json().get("observations", [])
                if not obs:
                    return None
                latest = obs[0]
                prev = obs[1] if len(obs) > 1 else None
                value = float(latest["value"]) if latest["value"] != "." else None
                prev_value = float(prev["value"]) if prev and prev["value"] != "." else None
                result = {
                    "series_id": series_id,
                    "label": FRED_SERIES.get(series_id, series_id),
                    "value": value,
                    "date": latest["date"],
                    "prev_value": prev_value,
                    "change": (value - prev_value) if (value is not None and prev_value is not None) else None,
                }
                cache.set(cache_key, result, ttl=3600)
                return result
            # Fallback: public fredgraph CSV
            r = await client.get(
                "https://fred.stlouisfed.org/graph/fredgraph.csv",
                params={"id": series_id},
            )
            r.raise_for_status()
            lines = [ln for ln in r.text.strip().split("\n") if ln]
            if len(lines) < 2:
                return None
            # Parse all rows, keep only those with a numeric value
            rows = []
            for ln in lines[1:]:
                parts = ln.split(",")
                if len(parts) < 2:
                    continue
                v = parts[1].strip().strip('"')
                if not v or v == ".":
                    continue
                try:
                    rows.append((parts[0].strip().strip('"'), float(v)))
                except ValueError:
                    continue
            if not rows:
                return None
            latest = rows[-1]
            prev = rows[-2] if len(rows) > 1 else None
            value = latest[1]
            prev_value = prev[1] if prev else None
            result = {
                "series_id": series_id,
                "label": FRED_SERIES.get(series_id, series_id),
                "value": value,
                "date": latest[0],
                "prev_value": prev_value,
                "change": (value - prev_value) if prev_value is not None else None,
            }
            cache.set(cache_key, result, ttl=3600)
            return result
    except Exception as e:
        return {
            "series_id": series_id,
            "label": FRED_SERIES.get(series_id, series_id),
            "error": str(e),
            "value": None,
            "date": None,
            "change": None,
            "prev_value": None,
        }


async def get_macro_panel() -> Dict[str, Any]:
    """Fetch the headline macro indicators for the dashboard."""
    series_ids = ["FEDFUNDS", "DGS10", "DGS2", "UNRATE", "CPIAUCSL"]
    out: Dict[str, Any] = {}
    for sid in series_ids:
        out[sid] = await fetch_series(sid)
    return out
