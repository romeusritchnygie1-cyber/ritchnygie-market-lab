"""Valuation Engine — Trailing & Forward P/E heatmap for SPX, Gold, Silver.

For SPX we compute a market-cap weighted P/E from the top 10 components
(closest free proxy for the "official" S&P 500 P/E). For commodities we use
institutional valuation-pressure equivalents — there's no earnings, so we
expose:
  • Gold      → Gold/CPI ratio (real-terms valuation) + 10Y Real Yield
                (negative real yields = green for gold; rising real yields = red)
  • Silver    → Gold/Silver ratio (already on the dashboard) + Copper momentum
                proxy for industrial demand (rising copper = green for silver)
"""
from __future__ import annotations
from typing import Dict, Any, List, Tuple
import yfinance as yf
from .cache import cache
from .market import _quote_from_history


# Top-10 SPX components by market cap (Q1-2026 mix — Mag7 + financials/health).
# We weight trailing & forward P/Es by market cap to approximate the index P/E.
SPX_TOP10 = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "BRK-B", "LLY", "JPM"]


def _info(symbol: str) -> Dict[str, Any]:
    cache_key = f"info:{symbol}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    try:
        info = yf.Ticker(symbol).info or {}
    except Exception:
        info = {}
    cache.set(cache_key, info, ttl=3600)
    return info


def _spx_pe() -> Dict[str, Any]:
    """Market-cap weighted trailing & forward P/E across SPX top-10.

    Uses earnings-yield aggregation (E/P weighted by market cap then inverted)
    — mathematically correct way to average P/E ratios; prevents single
    high-PE stocks like TSLA from skewing the index.
    """
    rows: List[Tuple[str, float, float, float]] = []
    for sym in SPX_TOP10:
        info = _info(sym)
        mc = info.get("marketCap")
        tpe = info.get("trailingPE")
        fpe = info.get("forwardPE")
        if mc and tpe and fpe and tpe > 0 and fpe > 0:
            rows.append((sym, float(mc), float(tpe), float(fpe)))
    if not rows:
        return {"trailing_pe": None, "forward_pe": None, "components": [], "error": "no data"}

    total_mc = sum(r[1] for r in rows)
    # Earnings-yield weighted aggregation (the correct way to average ratios)
    trailing_ey = sum((1.0 / r[2]) * r[1] for r in rows) / total_mc
    forward_ey = sum((1.0 / r[3]) * r[1] for r in rows) / total_mc
    trailing = 1.0 / trailing_ey if trailing_ey > 0 else None
    forward = 1.0 / forward_ey if forward_ey > 0 else None

    components = [
        {"symbol": s, "weight_pct": round(mc / total_mc * 100, 2), "trailing_pe": round(t, 2), "forward_pe": round(f, 2)}
        for s, mc, t, f in rows
    ]
    return {
        "trailing_pe": round(trailing, 2) if trailing else None,
        "forward_pe": round(forward, 2) if forward else None,
        "components": components,
        "method": "market-cap weighted top-10 SPX components (earnings-yield aggregation)",
    }


def _signal_from_pe(trailing: float, forward: float) -> Tuple[str, str, str]:
    """Forward<Trailing → green (growth bet) / Forward>Trailing → red (caution).
    Returns (signal, color_key, commentary)."""
    if trailing is None or forward is None:
        return ("UNKNOWN", "neutral", "P/E data unavailable.")
    delta = forward - trailing
    pct = (delta / trailing) * 100 if trailing else 0.0
    if pct < -3:
        return (
            "GROWTH BET",
            "green",
            f"Forward P/E ({forward:.2f}) is {abs(pct):.1f}% BELOW trailing — analysts expect "
            "earnings to expand. Momentum-friendly: institutions are pricing in growth.",
        )
    if pct > 3:
        return (
            "CAUTION",
            "red",
            f"Forward P/E ({forward:.2f}) is {pct:.1f}% ABOVE trailing — analysts expect "
            "earnings to DROP. The market is paying more for less profit. De-risk longs.",
        )
    return (
        "NEUTRAL",
        "amber",
        f"Forward P/E ({forward:.2f}) ≈ trailing ({trailing:.2f}). Consensus expects flat earnings — "
        "no clear growth catalyst, no panic. Trade the regime, not the valuation.",
    )


def _gold_valuation(cpi_yoy: float = 3.0) -> Dict[str, Any]:
    """Gold valuation pressure = 10Y real yield direction.
    Negative real yields (yield < expected inflation) = green for gold.
    cpi_yoy is supplied by the macro-pillars layer (live FRED YoY); defaults
    to 3.0% if unavailable."""
    try:
        gold = _quote_from_history("GOLD")
        tnx = _quote_from_history("TNX")
    except Exception:
        return {"error": "data fetch failed"}

    nominal_10y = tnx.get("price")
    real_yield = (nominal_10y - cpi_yoy) if (nominal_10y is not None) else None

    # Signal logic for gold:
    if real_yield is None:
        return {
            "trailing_metric": gold.get("price"),
            "forward_metric": None,
            "signal": "UNKNOWN",
            "color": "neutral",
            "commentary": "Cannot compute real yield.",
        }

    if real_yield < 0.5:
        signal = "GROWTH BET"
        color = "green"
        commentary = (
            f"Real 10Y yield {real_yield:+.2f}% — sub-floor. Holding cash LOSES purchasing "
            "power; gold's zero-yield 'penalty' disappears. Tailwind for longs."
        )
    elif real_yield > 2.0:
        signal = "CAUTION"
        color = "red"
        commentary = (
            f"Real 10Y yield {real_yield:+.2f}% — high carry cost. Treasuries pay you to wait; "
            "gold's opportunity cost is brutal. Headwind, expect mean-reversion lower."
        )
    else:
        signal = "NEUTRAL"
        color = "amber"
        commentary = (
            f"Real 10Y yield {real_yield:+.2f}% — moderate carry. Gold neither rewarded nor punished "
            "by rates. Trade the technical regime, not the macro."
        )

    return {
        "trailing_metric": round(nominal_10y or 0, 2),
        "trailing_label": "10Y Nominal Yield",
        "forward_metric": round(real_yield, 2),
        "forward_label": "10Y Real Yield",
        "signal": signal,
        "color": color,
        "commentary": commentary,
        "gold_price": gold.get("price"),
    }


def _silver_valuation() -> Dict[str, Any]:
    """Silver valuation pressure = Gold/Silver ratio + Copper momentum.
    Compressed ratio (<78) + rising copper = bullish silver."""
    try:
        from .ratio import gold_silver_ratio
        ratio = gold_silver_ratio()
        # Copper momentum = 20-day return on HG=F (or proxy via copper miners ETF if missing)
        copper_hist = yf.Ticker("HG=F").history(period="2mo", interval="1d", auto_adjust=False)
        if copper_hist.empty or len(copper_hist) < 20:
            copper_mom = 0.0
        else:
            recent = float(copper_hist["Close"].iloc[-1])
            ago = float(copper_hist["Close"].iloc[-20])
            copper_mom = ((recent - ago) / ago) * 100 if ago else 0.0
    except Exception as e:
        return {"error": str(e)}

    rratio = ratio.get("ratio")
    rsignal = (ratio.get("signal") or "").lower()

    # Combined signal:
    if "silver" in rsignal and copper_mom > 0:
        signal = "GROWTH BET"
        color = "green"
        commentary = (
            f"G/S ratio elevated at {rratio:.1f} + Copper +{copper_mom:.2f}% "
            "(20D). Industrial demand rising AND silver historically cheap vs gold — "
            "double-edge for longs."
        )
    elif "silver" in rsignal:
        signal = "GROWTH BET"
        color = "green"
        commentary = (
            f"G/S ratio elevated at {rratio:.1f}. Industrial demand soft (Copper {copper_mom:+.2f}%) "
            "but mean-reversion potential favors silver."
        )
    elif "gold" in rsignal and copper_mom < -2:
        signal = "CAUTION"
        color = "red"
        commentary = (
            f"G/S ratio compressed at {rratio:.1f} + Copper {copper_mom:.2f}% — both signals "
            "flash risk-off. Silver underperforms in this regime."
        )
    elif "gold" in rsignal:
        signal = "CAUTION"
        color = "red"
        commentary = (
            f"G/S ratio compressed at {rratio:.1f} — gold leads in defensive rotations. "
            "Silver is the higher-beta loser. Reduce exposure."
        )
    else:
        signal = "NEUTRAL"
        color = "amber"
        commentary = (
            f"G/S ratio at {rratio:.1f}, Copper 20D {copper_mom:+.2f}%. No edge in valuation — "
            "trade silver on intraday levels, not relative-value."
        )

    return {
        "trailing_metric": round(rratio or 0, 2),
        "trailing_label": "Gold/Silver Ratio",
        "forward_metric": round(copper_mom, 2),
        "forward_label": "Copper 20D Momentum %",
        "signal": signal,
        "color": color,
        "commentary": commentary,
        "silver_price": ratio.get("silver_price"),
    }


def get_valuation(cpi_yoy: float = 3.0) -> Dict[str, Any]:
    """Return P/E heatmap for SPX + commodity equivalents for Gold & Silver.
    cpi_yoy is the live YoY change in CPIAUCSL (computed by the pillars layer)."""
    cache_key = f"valuation:all:{round(cpi_yoy, 2)}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    spx_raw = _spx_pe()
    spx_signal, spx_color, spx_commentary = _signal_from_pe(
        spx_raw.get("trailing_pe"), spx_raw.get("forward_pe")
    )
    spx = {
        "symbol": "SPX",
        "label": "S&P 500",
        "broker": "FundedNext · CFD",
        "metric_type": "P/E Ratio",
        "trailing_metric": spx_raw.get("trailing_pe"),
        "trailing_label": "Trailing P/E (TTM)",
        "forward_metric": spx_raw.get("forward_pe"),
        "forward_label": "Forward P/E (NTM)",
        "signal": spx_signal,
        "color": spx_color,
        "commentary": spx_commentary,
        "method": spx_raw.get("method"),
        "components": spx_raw.get("components", []),
    }

    gold_v = _gold_valuation(cpi_yoy)
    gold_v.update({
        "symbol": "GOLD",
        "label": "Gold",
        "broker": "FTMO · OANDA",
        "metric_type": "Real Yield Pressure",
    })

    silver_v = _silver_valuation()
    silver_v.update({
        "symbol": "SILVER",
        "label": "Silver",
        "broker": "FTMO · OANDA",
        "metric_type": "Relative-Value Pressure",
    })

    out = {"spx": spx, "gold": gold_v, "silver": silver_v}
    cache.set(cache_key, out, ttl=900)  # 15-min cache
    return out
