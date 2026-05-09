"""Macro Pillars — three institutional gauges that drive 2026 SPX flow.

Pillar 1: Inflation Watchdog — CPI YoY vs Fed 2% target.
          CPI > 3%  → SPX color flips amber (high P/E becomes 'heavy').
Pillar 2: Liquidity Meter — DXY 5-day momentum.
          Spiking DXY → "Reduce Long Exposure" red flag.
Pillar 3: Fear Index — VIX live.
          VIX > 20 → red alert; institutions de-risk equity.
"""
from __future__ import annotations
from typing import Dict, Any, Optional
import yfinance as yf
from .cache import cache
from .market import _quote_from_history
from .fred_service import fetch_series


# ---------- Pillar 1: Inflation Watchdog ----------
async def _cpi_yoy() -> Optional[float]:
    """CPI YoY% from FRED CPIAUCSL: latest vs 12-months-ago."""
    cache_key = "cpi_yoy"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    import os
    import httpx

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            key = os.environ.get("FRED_API_KEY")
            if key:
                r = await client.get(
                    "https://api.stlouisfed.org/fred/series/observations",
                    params={
                        "series_id": "CPIAUCSL",
                        "api_key": key,
                        "file_type": "json",
                        "sort_order": "desc",
                        "limit": 14,
                    },
                )
                r.raise_for_status()
                obs = r.json().get("observations", [])
                values = [float(o["value"]) for o in obs if o.get("value") and o["value"] != "."]
            else:
                r = await client.get(
                    "https://fred.stlouisfed.org/graph/fredgraph.csv",
                    params={"id": "CPIAUCSL"},
                )
                r.raise_for_status()
                rows = []
                for ln in r.text.strip().split("\n")[1:]:
                    parts = ln.split(",")
                    if len(parts) < 2:
                        continue
                    v = parts[1].strip().strip('"')
                    if not v or v == ".":
                        continue
                    try:
                        rows.append(float(v))
                    except ValueError:
                        continue
                values = rows[-14:][::-1]  # reverse to desc

            if len(values) < 13:
                return None
            latest = values[0]
            year_ago = values[12]
            yoy = ((latest - year_ago) / year_ago) * 100 if year_ago else None
            if yoy is not None:
                cache.set(cache_key, yoy, ttl=3600)
            return yoy
    except Exception:
        return None


async def _inflation_pillar() -> Dict[str, Any]:
    yoy = await _cpi_yoy()
    target = 2.0
    if yoy is None:
        return {
            "name": "Inflation Watchdog",
            "value": None,
            "label": "CPI YoY",
            "target": target,
            "color": "neutral",
            "headline": "CPI data unavailable.",
            "commentary": "Falling back to defaults — re-check FRED feed.",
            "spx_warning": False,
        }

    if yoy > 3.0:
        color = "amber"
        spx_warning = True
        headline = f"HOT — {yoy:.2f}% YoY"
        commentary = (
            f"CPI at {yoy:.2f}% is {yoy - target:.2f}pp above the Fed's 2% target. "
            "High inflation makes the SPX P/E expansion vulnerable: rate cuts get postponed, "
            "discount rates stay high, multiples compress. SPX hero card flips to amber."
        )
    elif yoy > 2.5:
        color = "amber"
        spx_warning = False
        headline = f"WARM — {yoy:.2f}% YoY"
        commentary = (
            f"CPI at {yoy:.2f}% is sticky above 2%. Fed in 'wait-and-see' mode. Watch for "
            "PPI / NFP confirmation — a hot print rotates institutions out of duration."
        )
    else:
        color = "green"
        spx_warning = False
        headline = f"COOL — {yoy:.2f}% YoY"
        commentary = (
            f"CPI at {yoy:.2f}% is approaching the 2% target. Disinflation tailwind for "
            "equities; Fed has runway to cut. Multiple expansion is justifiable."
        )

    return {
        "name": "Inflation Watchdog",
        "value": round(yoy, 2),
        "label": "CPI YoY",
        "unit": "%",
        "target": target,
        "color": color,
        "headline": headline,
        "commentary": commentary,
        "spx_warning": spx_warning,
    }


# ---------- Pillar 2: Liquidity Meter (DXY momentum) ----------
def _dxy_pillar() -> Dict[str, Any]:
    cache_key = "pillar:dxy"
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        hist = yf.Ticker("DX-Y.NYB").history(period="1mo", interval="1d", auto_adjust=False)
        if hist.empty or len(hist) < 6:
            raise ValueError("insufficient DXY history")
        last = float(hist["Close"].iloc[-1])
        five_ago = float(hist["Close"].iloc[-6])
        mom_5d = ((last - five_ago) / five_ago) * 100 if five_ago else 0.0
    except Exception:
        return {
            "name": "Liquidity Meter",
            "value": None,
            "label": "DXY 5D Momentum",
            "color": "neutral",
            "headline": "DXY data unavailable.",
            "commentary": "",
            "spx_warning": False,
        }

    if mom_5d > 1.0:
        color = "red"
        spx_warning = True
        headline = f"SPIKING — DXY +{mom_5d:.2f}% (5D)"
        commentary = (
            "Dollar surging — emerging-markets selling pressure, USD-denominated earnings of "
            "SPX multinationals get crushed on translation. Reduce long exposure; tactical de-risk."
        )
    elif mom_5d > 0.3:
        color = "amber"
        spx_warning = False
        headline = f"FIRM — DXY +{mom_5d:.2f}% (5D)"
        commentary = (
            "Mild dollar strength. Watch the breakout level — if DXY clears the 5D high another "
            "1%, the SPX rally typically loses steam in 24–48h."
        )
    elif mom_5d < -0.5:
        color = "green"
        spx_warning = False
        headline = f"WEAK — DXY {mom_5d:.2f}% (5D)"
        commentary = (
            "Dollar fading — net liquidity pumping into risk assets. SPX usually catches a bid "
            "in this regime, especially mega-cap tech with overseas exposure."
        )
    else:
        color = "neutral"
        spx_warning = False
        headline = f"FLAT — DXY {mom_5d:+.2f}% (5D)"
        commentary = (
            "DXY rangebound. No liquidity headwind, no tailwind. Trade equities on their own "
            "merits — flow, breadth, regime."
        )

    out = {
        "name": "Liquidity Meter",
        "value": round(mom_5d, 2),
        "label": "DXY 5D Momentum",
        "unit": "%",
        "level": round(last, 2),
        "color": color,
        "headline": headline,
        "commentary": commentary,
        "spx_warning": spx_warning,
    }
    cache.set(cache_key, out, ttl=300)
    return out


# ---------- Pillar 3: Fear Index (VIX) ----------
def _vix_pillar() -> Dict[str, Any]:
    cache_key = "pillar:vix"
    cached = cache.get(cache_key)
    if cached:
        return cached

    vix = _quote_from_history("VIX")
    level = vix.get("price")
    change_pct = vix.get("change_pct", 0)

    if level is None:
        return {
            "name": "Fear Index",
            "value": None,
            "label": "VIX",
            "color": "neutral",
            "headline": "VIX unavailable.",
            "commentary": "",
            "spx_warning": False,
        }

    if level >= 25:
        color = "red"
        spx_warning = True
        headline = f"PANIC — VIX {level:.2f}"
        commentary = (
            f"VIX above 25 ({change_pct:+.2f}%). Institutions are aggressively hedging. Geopolitics "
            "or earnings disappointment — expect 1–2 day flush before any rebound. Cut size."
        )
    elif level >= 20:
        color = "amber"
        spx_warning = True
        headline = f"ALERT — VIX {level:.2f}"
        commentary = (
            f"VIX crossed 20 ({change_pct:+.2f}%). This is the institutional de-risk threshold. "
            "Tight stops, half-size, no holding through the close until VIX breaks back below 18."
        )
    elif level >= 15:
        color = "neutral"
        spx_warning = False
        headline = f"NORMAL — VIX {level:.2f}"
        commentary = (
            f"VIX in normal volatility band ({change_pct:+.2f}%). Healthy market — institutions "
            "comfortable carrying risk. Standard playbook applies."
        )
    else:
        color = "green"
        spx_warning = False
        headline = f"COMPLACENT — VIX {level:.2f}"
        commentary = (
            f"VIX below 15 ({change_pct:+.2f}%). Low fear, full risk-on. Be aware: complacent "
            "tape can flip violently — keep one eye on the calendar for catalysts."
        )

    out = {
        "name": "Fear Index",
        "value": round(level, 2),
        "label": "VIX",
        "change_pct": round(change_pct, 2),
        "color": color,
        "headline": headline,
        "commentary": commentary,
        "spx_warning": spx_warning,
    }
    cache.set(cache_key, out, ttl=60)
    return out


# ---------- Composite ----------
async def get_pillars() -> Dict[str, Any]:
    """Return all 3 macro pillars + the composite SPX warning state."""
    inflation = await _inflation_pillar()
    dxy = _dxy_pillar()
    vix = _vix_pillar()

    # Composite SPX caution flag if ANY pillar is signalling a warning
    spx_caution = any([
        inflation.get("spx_warning"),
        dxy.get("spx_warning"),
        vix.get("spx_warning"),
    ])

    # Aggregate color (worst wins): red > amber > neutral > green
    sev = {"red": 3, "amber": 2, "neutral": 1, "green": 0}
    pillars = [inflation, dxy, vix]
    composite_color = max((p.get("color", "neutral") for p in pillars), key=lambda c: sev.get(c, 0))

    # Build 1-line summary headline
    if spx_caution:
        if composite_color == "red":
            summary = "SPX RISK-OFF — multiple pillars flashing red. Reduce long exposure."
        else:
            summary = "SPX CAUTION — at least one macro pillar elevated. Tighter risk."
    else:
        summary = "SPX TAILWIND — all three macro pillars constructive."

    return {
        "inflation": inflation,
        "dxy": dxy,
        "vix": vix,
        "spx_caution": spx_caution,
        "composite_color": composite_color,
        "summary": summary,
        "cpi_yoy": inflation.get("value"),  # exposed for valuation engine
    }
