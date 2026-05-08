"""Market Regime Engine — classifies the current macro environment."""
from typing import Dict, Any, List
from .market import get_quote, get_history
from .indicators import compute_adx, compute_atr


def _safe_pct(quote: Dict[str, Any]) -> float:
    return quote.get("change_pct") or 0.0


def classify_regime() -> Dict[str, Any]:
    """Multi-signal regime classification.
    Signals scanned: SPX trend (ADX), VIX level, DXY direction, Gold direction.
    Returns one or more regime tags with confidence + supporting signals.
    """
    spx = get_quote("SPX")
    vix = get_quote("VIX")
    dxy = get_quote("DXY")
    gold = get_quote("GOLD")

    signals: List[Dict[str, Any]] = []
    tags: List[str] = []

    # Trend strength via ADX on SPX
    try:
        spx_hist = get_history("SPX", period="3mo", interval="1d")
        adx_value = float(compute_adx(spx_hist).iloc[-1])
        atr_value = float(compute_atr(spx_hist).iloc[-1])
        atr_pct = (atr_value / float(spx_hist["Close"].iloc[-1])) * 100
    except Exception:
        adx_value = 0.0
        atr_pct = 0.0

    if adx_value >= 25:
        tags.append("Trending")
        signals.append({"name": "ADX(14)", "value": round(adx_value, 1), "note": "Trend strength elevated"})
    elif adx_value > 0:
        tags.append("Choppy")
        signals.append({"name": "ADX(14)", "value": round(adx_value, 1), "note": "Range-bound conditions"})

    # Volatility regime via VIX
    vix_price = vix.get("price") or 0
    if vix_price >= 25:
        tags.append("High Volatility")
    elif 0 < vix_price < 14:
        tags.append("Low Volatility")
    if vix_price:
        signals.append({"name": "VIX", "value": vix_price, "note": _vix_note(vix_price)})

    # Risk-on / Risk-off composite
    spx_chg = _safe_pct(spx)
    vix_chg = _safe_pct(vix)
    gold_chg = _safe_pct(gold)
    dxy_chg = _safe_pct(dxy)

    risk_on_score = 0
    risk_on_score += 1 if spx_chg > 0 else -1
    risk_on_score += 1 if vix_chg < 0 else -1
    risk_on_score += 1 if gold_chg < 0 else -1
    risk_on_score += 1 if dxy_chg < 0 else -1

    if risk_on_score >= 2:
        tags.append("Risk-On")
    elif risk_on_score <= -2:
        tags.append("Risk-Off")
    else:
        tags.append("Mixed")

    signals.append({
        "name": "Risk Composite",
        "value": risk_on_score,
        "note": f"SPX {spx_chg:+.2f}% / VIX {vix_chg:+.2f}% / Gold {gold_chg:+.2f}% / DXY {dxy_chg:+.2f}%"
    })

    # Liquidity proxy via ATR%
    if 0 < atr_pct < 0.5:
        tags.append("Low Liquidity")

    primary = tags[0] if tags else "Neutral"

    return {
        "primary": primary,
        "tags": tags,
        "signals": signals,
        "score": risk_on_score,
        "adx": round(adx_value, 1),
        "vix": vix_price,
        "atr_pct": round(atr_pct, 3),
    }


def _vix_note(v: float) -> str:
    if v >= 30:
        return "Fear / panic regime"
    if v >= 20:
        return "Elevated stress"
    if v >= 15:
        return "Normal volatility"
    return "Complacency / low fear"
