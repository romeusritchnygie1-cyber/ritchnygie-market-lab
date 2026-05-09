"""Dynamic Market Analysis Engine.
Computes support/resistance, liquidity zones, regime, breakout probability,
continuation probability, reversal warnings + actionable buy-above / sell-below
levels. Designed for SPX, Silver, Gold (works on any symbol with OHLC data).
"""
from typing import Dict, Any, List, Optional, Tuple
import math
import pandas as pd
import numpy as np
from .market import get_history, get_quote
from .indicators import compute_adx, compute_atr, compute_rsi


# ---------------------------------------------------------------------------
# Building blocks
# ---------------------------------------------------------------------------

def _swing_pivots(df: pd.DataFrame, window: int = 5) -> Tuple[List[float], List[float]]:
    """Return (swing_highs, swing_lows) — fractal pivot points using `window` bars on each side."""
    highs, lows = [], []
    h = df["High"].values
    l = df["Low"].values
    n = len(df)
    for i in range(window, n - window):
        if h[i] == max(h[i - window: i + window + 1]):
            highs.append(float(h[i]))
        if l[i] == min(l[i - window: i + window + 1]):
            lows.append(float(l[i]))
    return highs, lows


def _cluster_levels(prices: List[float], tolerance_pct: float) -> List[Dict[str, Any]]:
    """Cluster nearby price points into liquidity zones. tolerance is relative."""
    if not prices:
        return []
    sorted_p = sorted(prices)
    clusters: List[List[float]] = [[sorted_p[0]]]
    for p in sorted_p[1:]:
        ref = sum(clusters[-1]) / len(clusters[-1])
        if abs(p - ref) / ref <= tolerance_pct:
            clusters[-1].append(p)
        else:
            clusters.append([p])

    out = []
    for c in clusters:
        out.append({
            "low":   round(min(c), 4),
            "high":  round(max(c), 4),
            "mid":   round(sum(c) / len(c), 4),
            "touches": len(c),
            "strength": "strong" if len(c) >= 3 else ("moderate" if len(c) == 2 else "weak"),
        })
    out.sort(key=lambda z: z["mid"])
    return out


def _correlation(a: pd.Series, b: pd.Series, lookback: int = 30) -> Optional[float]:
    if len(a) < lookback or len(b) < lookback:
        return None
    a_ret = a.pct_change().dropna().tail(lookback)
    b_ret = b.pct_change().dropna().tail(lookback)
    joined = pd.concat([a_ret, b_ret], axis=1).dropna()
    if len(joined) < 10:
        return None
    return round(float(joined.corr().iloc[0, 1]), 3)


def _classify_regime(close: float, sma50: float, adx: float, vix: float) -> Tuple[str, str]:
    if adx >= 25 and close > sma50:
        return "Bullish Trending", "bullish"
    if adx >= 25 and close < sma50:
        return "Bearish Trending", "bearish"
    if vix is not None and vix >= 25:
        return "High Volatility / Risk-Off", "bearish"
    if adx < 18:
        return "Choppy / Range", "neutral"
    return "Mixed / Transitional", "neutral"


def _logistic(x: float) -> float:
    return 1 / (1 + math.exp(-x))


# ---------------------------------------------------------------------------
# Main analysis
# ---------------------------------------------------------------------------

def analyze(symbol: str) -> Dict[str, Any]:
    sym = symbol.upper()
    df = get_history(sym, period="6mo", interval="1d")
    if df.empty or len(df) < 60:
        return {"error": "insufficient data", "symbol": sym}

    close = float(df["Close"].iloc[-1])
    sma20 = float(df["Close"].rolling(20).mean().iloc[-1])
    sma50 = float(df["Close"].rolling(50).mean().iloc[-1])

    adx = float(compute_adx(df).iloc[-1])
    atr = float(compute_atr(df).iloc[-1])
    rsi = float(compute_rsi(df).iloc[-1])
    atr_pct = (atr / close) * 100 if close else 0.0

    # 14-day high / low (recent breakout reference)
    recent_high_14 = float(df["High"].tail(14).max())
    recent_low_14  = float(df["Low"].tail(14).min())
    recent_high_50 = float(df["High"].tail(50).max())
    recent_low_50  = float(df["Low"].tail(50).min())

    # Pivots → liquidity zones
    highs, lows = _swing_pivots(df, window=4)
    tol = max(0.004, atr_pct / 100 * 0.5)  # cluster tolerance ~ half ATR%
    resistance_zones = _cluster_levels(highs, tolerance_pct=tol)
    support_zones    = _cluster_levels(lows,  tolerance_pct=tol)

    nearest_resistance = next((z for z in resistance_zones if z["mid"] > close), None)
    nearest_support    = next((z for z in reversed(support_zones)    if z["mid"] < close), None)

    # Macro context: VIX, DXY, 10Y
    vix_q = get_quote("VIX")
    vix = vix_q.get("price")

    dxy_hist = get_history("DXY", period="3mo", interval="1d")
    tnx_hist = get_history("TNX", period="3mo", interval="1d")
    spx_hist = get_history("SPX", period="3mo", interval="1d")

    corr_dxy = _correlation(df["Close"], dxy_hist["Close"]) if not dxy_hist.empty else None
    corr_tnx = _correlation(df["Close"], tnx_hist["Close"]) if not tnx_hist.empty else None
    corr_spx = _correlation(df["Close"], spx_hist["Close"]) if not spx_hist.empty else None

    # Regime
    regime_label, regime_bias = _classify_regime(close, sma50, adx, vix)

    # Buy-above / Sell-below levels (key actionable lines)
    buy_above_level  = nearest_resistance["mid"] if nearest_resistance else recent_high_14
    buy_above_level += 0.10 * atr  # add slippage cushion
    sell_below_level = nearest_support["mid"] if nearest_support else recent_low_14
    sell_below_level -= 0.10 * atr

    # No-trade zone — sandwiched between SMA20 ± 0.5 * ATR when ADX is low
    no_trade_zone = None
    if adx < 18:
        no_trade_zone = {
            "low":  round(sma20 - 0.5 * atr, 4),
            "high": round(sma20 + 0.5 * atr, 4),
            "reason": "Low ADX (<18) — choppy range, edge unfavorable",
        }

    # Breakout probability — logistic of (ADX-25)/5 + macro_score
    macro_score = 0.0
    if regime_bias == "bullish": macro_score += 0.6
    if regime_bias == "bearish": macro_score -= 0.6
    if vix is not None and vix > 22: macro_score -= 0.4
    breakout_prob = _logistic((adx - 25) / 5 + macro_score)
    breakout_prob = round(min(0.95, max(0.05, breakout_prob)) * 100, 1)

    # Continuation probability — bias × ADX strength × position vs SMA50
    above_sma = 1 if close > sma50 else -1
    cont_score = (adx - 20) / 8 + above_sma * 0.5
    if regime_bias == "neutral":
        cont_score *= 0.4
    continuation_prob = round(min(0.95, max(0.05, _logistic(cont_score))) * 100, 1)

    # Reversal warnings — RSI extremes + price vs band
    reversal_signals: List[str] = []
    if rsi >= 72:
        reversal_signals.append(f"RSI {rsi:.1f} overbought — exhaustion risk")
    if rsi <= 28:
        reversal_signals.append(f"RSI {rsi:.1f} oversold — bounce risk")
    if close >= recent_high_50 * 0.998:
        reversal_signals.append("Price at 50-day high — failure-to-break is a fade signal")
    if close <= recent_low_50 * 1.002:
        reversal_signals.append("Price at 50-day low — failed breakdown is a long signal")
    if adx > 35 and atr_pct > 2.0:
        reversal_signals.append(f"ADX {adx:.0f} + ATR {atr_pct:.1f}% — overstretched, watch for snapback")

    # Trade bias narrative
    if regime_bias == "bullish":
        bias_color = "blue"
        narrative = (
            f"{sym} is in a Bullish Trending regime (ADX {adx:.1f}). "
            f"Long bias above {buy_above_level:.2f}; invalid below {sell_below_level:.2f}. "
            f"Continuation probability {continuation_prob}%."
        )
    elif regime_bias == "bearish":
        bias_color = "red"
        narrative = (
            f"{sym} is in a Bearish regime (ADX {adx:.1f}, VIX {vix or 'n/a'}). "
            f"Short bias below {sell_below_level:.2f}; invalid above {buy_above_level:.2f}. "
            f"Continuation probability {continuation_prob}%."
        )
    else:
        bias_color = "amber"
        narrative = (
            f"{sym} regime is Mixed/Choppy (ADX {adx:.1f}). "
            f"Patience: wait for break above {buy_above_level:.2f} or below {sell_below_level:.2f}. "
            f"Breakout probability {breakout_prob}%."
        )

    return {
        "symbol": sym,
        "close": round(close, 4),
        "sma20": round(sma20, 4),
        "sma50": round(sma50, 4),
        "indicators": {
            "adx": round(adx, 1),
            "atr": round(atr, 4),
            "atr_pct": round(atr_pct, 3),
            "rsi": round(rsi, 1),
            "vix": vix,
        },
        "regime": {
            "label": regime_label,
            "bias": regime_bias,
            "color": bias_color,
        },
        "levels": {
            "buy_above": round(buy_above_level, 4),
            "sell_below": round(sell_below_level, 4),
            "recent_high_14": round(recent_high_14, 4),
            "recent_low_14":  round(recent_low_14, 4),
            "recent_high_50": round(recent_high_50, 4),
            "recent_low_50":  round(recent_low_50, 4),
        },
        "support_zones":    support_zones[-5:],
        "resistance_zones": resistance_zones[:5],
        "nearest_support":    nearest_support,
        "nearest_resistance": nearest_resistance,
        "no_trade_zone": no_trade_zone,
        "probabilities": {
            "breakout":    breakout_prob,
            "continuation": continuation_prob,
        },
        "macro_correlations": {
            "vs_spx": corr_spx,
            "vs_dxy": corr_dxy,
            "vs_10y": corr_tnx,
        },
        "reversal_warnings": reversal_signals,
        "narrative": narrative,
    }
