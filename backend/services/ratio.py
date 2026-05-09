"""Gold/Silver ratio analytics — XAU/XAG."""
from typing import Dict, Any, List
import pandas as pd
from .market import get_history, get_quote


def gold_silver_ratio() -> Dict[str, Any]:
    """Current ratio + 1y history + 52w range + signal."""
    gold_q = get_quote("GOLD")
    silver_q = get_quote("SILVER")

    if not gold_q.get("price") or not silver_q.get("price"):
        return {"error": "missing prices"}

    current = gold_q["price"] / silver_q["price"]

    # Defensive defaults — guarantees these are always defined regardless of which
    # branch fires below. Static analyzers can't always prove it; this makes intent explicit.
    signal: str = "Neutral"
    signal_color: str = "neutral"
    signal_strength: str = "balanced"
    commentary: str = (
        "Ratio in mid-range — no strong precious-metals bias. "
        "Trade direction with macro flow, sized normally."
    )

    # 1y daily history
    g_hist = get_history("GOLD", period="1y", interval="1d")
    s_hist = get_history("SILVER", period="1y", interval="1d")
    history: List[Dict[str, Any]] = []
    high_52w = current
    low_52w = current

    if not g_hist.empty and not s_hist.empty:
        merged = pd.concat([g_hist["Close"].rename("g"), s_hist["Close"].rename("s")], axis=1).dropna()
        ratios = merged["g"] / merged["s"]
        for ts, val in ratios.items():
            history.append({"time": int(ts.timestamp()), "value": round(float(val), 3)})
        high_52w = float(ratios.max())
        low_52w = float(ratios.min())

    # Signal heuristics (industry rough thresholds)
    if current >= 88:
        signal = "Favor Silver"
        signal_color = "cyan"
        signal_strength = "strong"
        commentary = (
            "Ratio is rich — historically silver outperforms gold from these levels. "
            "Watch London-session breakouts in Silver (XAGUSD)."
        )
    elif current >= 82:
        signal = "Favor Silver"
        signal_color = "cyan"
        signal_strength = "moderate"
        commentary = (
            "Ratio slightly elevated; silver has a mild relative-value edge. "
            "Build long-silver setups on London opens with confirmation."
        )
    elif current <= 72:
        signal = "Favor Gold"
        signal_color = "amber"
        signal_strength = "strong"
        commentary = (
            "Ratio compressed — gold has historically outperformed from these levels. "
            "Defensive macro / risk-off positioning favors gold."
        )
    elif current <= 78:
        signal = "Favor Gold"
        signal_color = "amber"
        signal_strength = "moderate"
        commentary = (
            "Ratio near lower band; gold has a modest edge. "
            "Watch for risk-off catalysts (CPI, FOMC, geopolitical headlines)."
        )
    else:
        signal = "Neutral"
        signal_color = "neutral"
        signal_strength = "balanced"
        commentary = (
            "Ratio in mid-range — no strong precious-metals bias. "
            "Trade direction with macro flow, sized normally."
        )

    pct_in_range = 0.5
    if high_52w > low_52w:
        pct_in_range = (current - low_52w) / (high_52w - low_52w)

    return {
        "ratio": round(current, 3),
        "gold_price": gold_q["price"],
        "silver_price": silver_q["price"],
        "signal": signal,
        "signal_color": signal_color,
        "signal_strength": signal_strength,
        "commentary": commentary,
        "high_52w": round(high_52w, 2),
        "low_52w": round(low_52w, 2),
        "pct_in_range": round(pct_in_range, 3),
        "history": history,
        "thresholds": {"silver_favored_above": 82, "gold_favored_below": 78},
    }
