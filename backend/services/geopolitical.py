"""Geopolitical Alerts — filter market news for high-impact geopolitical events.

Pulls from existing yfinance news streams across SPX/Gold/Silver/DXY/VIX/Mag7/banks
and ranks by:
  • Keyword density (war/sanctions/tariff/etc)
  • Severity tier (PEAK / HIGH / MEDIUM)
  • Recency (decay over 24h)
"""
from __future__ import annotations
from typing import Dict, Any, List
from datetime import datetime, timezone, timedelta
import re

from .market import get_news_for, SYMBOL_MAP
from .news_service import get_combined_news
from .cache import cache

# Tiered keyword lexicon — case-insensitive match.
# PEAK = active conflict / market-moving sovereign action
# HIGH = sanctions, tariffs, OPEC, escalations
# MEDIUM = diplomatic tension, watch-list signals
KEYWORDS = {
    "peak": [
        r"\bwar\b(?!\s+room|\s+chest|\s+games)", r"\bmissile\b", r"\bairstrike",
        r"\bnuclear\s+(weapon|strike|test|threat|warhead)", r"\bnuke",
        r"\binvasion\b", r"\bairstrike", r"\bbombing\b", r"\bground\s+troops?\b",
        r"\bcyberattack", r"\boil[- ]facility\s+(attack|hit|struck)",
        r"\bmilitary\s+strike",
    ],
    "high": [
        r"\bsanction", r"\btariff", r"\btrade\s+war", r"\bopec\b", r"\boil\s+embargo",
        r"\bescalat", r"\bretaliat", r"\bgeopolitical\s+crisis", r"\bconflict\b",
        r"\biran\b", r"\bnorth\s+korea", r"\btaiwan\b", r"\bsouth\s+china\s+sea",
        r"\brussia\b", r"\bukraine\b", r"\bisrael\b", r"\bhamas\b", r"\bhezbollah",
        r"\bgaza\b", r"\bwest\s+bank", r"\byemen\b", r"\bhouthi", r"\bred\s+sea",
        r"\bstrait\s+of\s+hormuz", r"\bsuez\b",
    ],
    "medium": [
        r"\bgeopolit", r"\bdiploma", r"\bsummit\b",
        r"\bun\s+security\s+council", r"\bnato\b", r"\beu\s+parliament",
        r"\bexport\s+control", r"\bchip\s+ban", r"\bsemiconductor\s+restrict",
        r"\bxi\s+jinping", r"\bputin\b",
        r"\bborder\s+(crisis|tension|dispute)", r"\bmigrant\s+crisis",
    ],
}
SEV_RANK = {"peak": 3, "high": 2, "medium": 1, "none": 0}
SEV_LABEL = {3: "PEAK", 2: "HIGH", 1: "MEDIUM", 0: "LOW"}


def _classify(text: str) -> Dict[str, Any]:
    """Return {severity, severity_score, matched_keywords}."""
    text_l = text.lower()
    matches: Dict[str, List[str]] = {"peak": [], "high": [], "medium": []}
    for tier, patterns in KEYWORDS.items():
        for p in patterns:
            m = re.search(p, text_l)
            if m:
                matches[tier].append(m.group(0))

    if matches["peak"]:
        sev = "peak"
    elif matches["high"]:
        sev = "high"
    elif matches["medium"]:
        sev = "medium"
    else:
        sev = "none"

    all_matched = list(set(matches["peak"] + matches["high"] + matches["medium"]))
    return {
        "severity": sev,
        "severity_score": SEV_RANK[sev] + min(len(all_matched), 5) * 0.1,
        "severity_label": SEV_LABEL[SEV_RANK[sev]],
        "matched_keywords": all_matched[:6],
    }


def _recency_factor(published_at: str) -> float:
    """1.0 if just posted, decays linearly to 0.3 over 24h, then 0.1 over 72h."""
    try:
        dt = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        age_h = (now - dt).total_seconds() / 3600
        if age_h < 0:
            return 1.0
        if age_h <= 24:
            return 1.0 - (age_h / 24) * 0.7
        if age_h <= 72:
            return 0.3 - ((age_h - 24) / 48) * 0.2
        return 0.1
    except Exception:
        return 0.5


def get_geopolitical_alerts(limit: int = 12, min_severity: str = "medium") -> Dict[str, Any]:
    """Aggregate, filter and rank geopolitical news across the user's traded universe."""
    cache_key = f"geo:alerts:{limit}:{min_severity}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    # Pull news from a wide cross-section of the user's watched symbols
    sources = ["SPX", "GOLD", "SILVER", "DXY", "TNX", "VIX", "GS", "MS"]
    raw: List[Dict[str, Any]] = []
    seen_titles = set()
    for sym in sources:
        if sym not in SYMBOL_MAP:
            continue
        try:
            for item in get_news_for(sym, limit=15):
                t = (item.get("title") or "").strip()
                if not t or t in seen_titles:
                    continue
                seen_titles.add(t)
                item["source_symbol"] = sym
                raw.append(item)
        except Exception:
            continue

    # Augment with macro headlines (broader macro feed)
    try:
        for item in get_combined_news("macro", limit=30):
            t = (item.get("title") or "").strip()
            if not t or t in seen_titles:
                continue
            seen_titles.add(t)
            item["source_symbol"] = "MACRO"
            raw.append(item)
    except Exception:
        pass

    min_score = SEV_RANK.get(min_severity, 1)

    alerts: List[Dict[str, Any]] = []
    for item in raw:
        title = item.get("title", "")
        cls = _classify(title)
        if SEV_RANK[cls["severity"]] < min_score:
            continue
        recency = _recency_factor(item.get("published_at", ""))
        rank_score = cls["severity_score"] * recency
        alerts.append({
            "title": title,
            "url": item.get("url", "#"),
            "publisher": item.get("publisher", ""),
            "published_at": item.get("published_at", ""),
            "source_symbol": item.get("source_symbol", ""),
            "severity": cls["severity"],
            "severity_label": cls["severity_label"],
            "severity_score": round(cls["severity_score"], 2),
            "matched_keywords": cls["matched_keywords"],
            "rank_score": round(rank_score, 3),
        })

    alerts.sort(key=lambda a: a["rank_score"], reverse=True)
    top = alerts[:limit]

    # Composite alert level for the dashboard banner
    if any(a["severity"] == "peak" for a in top):
        composite = "peak"
        composite_msg = "PEAK GEOPOLITICAL RISK — active conflict / sovereign action headlines. Reduce exposure across SPX & risk assets; gold tailwind."
    elif any(a["severity"] == "high" for a in top):
        composite = "high"
        composite_msg = "ELEVATED GEOPOLITICAL RISK — sanctions / escalation news in the tape. Tighter risk; respect VIX moves."
    elif any(a["severity"] == "medium" for a in top):
        composite = "medium"
        composite_msg = "Diplomatic tension on the wire — monitor for escalation; trade normally but stay alert."
    else:
        composite = "low"
        composite_msg = "No material geopolitical headlines. Trade the technicals."

    out = {
        "composite_severity": composite,
        "composite_label": SEV_LABEL[SEV_RANK[composite]],
        "composite_message": composite_msg,
        "alerts": top,
        "count": len(alerts),
        "sources_scanned": len(sources) + 1,
    }
    cache.set(cache_key, out, ttl=300)  # 5-min cache
    return out
