"""Behavior & probability analytics over the trade journal."""
from collections import defaultdict
from datetime import datetime
from typing import List, Dict, Any, Optional
import statistics


WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _parse_at(t: dict) -> datetime:
    v = t.get("traded_at")
    if isinstance(v, datetime):
        return v
    return datetime.fromisoformat(v) if v else datetime.utcnow()


def _is_win(t: dict) -> bool:
    # Honor explicit `result` field if present
    r = t.get("result")
    if r:
        return r == "win"
    p = t.get("pnl")
    if p is None:
        rm = t.get("r_multiple")
        return (rm or 0) > 0
    return p > 0


def _r(t: dict) -> float:
    return t.get("r_multiple") or 0.0


def _pnl(t: dict) -> float:
    return t.get("pnl") or 0.0


def behavior_stats(trades: List[dict], symbol_filter: Optional[str] = None) -> Dict[str, Any]:
    """Top-level winrate / expectancy / by-session / by-day / by-symbol breakdown.
    If `symbol_filter` is provided (e.g. 'SPX', 'SILVER', 'GOLD'), restrict to those."""
    if symbol_filter:
        sf = symbol_filter.upper()
        trades = [t for t in trades if (t.get("symbol") or "").upper() == sf]
    n = len(trades)
    if n == 0:
        return {"total": 0, "winrate": 0.0, "expectancy": 0.0, "avg_r": 0.0,
                "total_pnl": 0.0, "avg_adx_winners": 0.0, "avg_adx_losers": 0.0,
                "avg_atr_winners": 0.0, "avg_atr_losers": 0.0,
                "by_session": [], "by_day": [], "by_symbol": [], "by_setup": []}

    wins = [t for t in trades if _is_win(t)]
    losses = [t for t in trades if not _is_win(t)]
    win_rs = [_r(t) for t in wins if _r(t)]
    loss_rs = [_r(t) for t in losses if _r(t)]
    avg_win_r = statistics.mean(win_rs) if win_rs else 0.0
    avg_loss_r = statistics.mean(loss_rs) if loss_rs else 0.0
    winrate = len(wins) / n if n else 0
    expectancy = winrate * avg_win_r + (1 - winrate) * avg_loss_r

    def grp(key_fn, sort_fn=None):
        buckets: Dict[str, List[dict]] = defaultdict(list)
        for t in trades:
            buckets[key_fn(t)].append(t)
        rows = []
        for k, ts in buckets.items():
            w = sum(1 for t in ts if _is_win(t))
            rs = [_r(t) for t in ts if _r(t)]
            pnls = [_pnl(t) for t in ts if _pnl(t)]
            rows.append({
                "key": k or "—",
                "trades": len(ts),
                "winrate": round(100 * w / len(ts), 1),
                "avg_r": round(statistics.mean(rs), 2) if rs else 0.0,
                "total_pnl": round(sum(pnls), 2),
            })
        rows.sort(key=sort_fn or (lambda r: -r["trades"]))
        return rows

    by_session = grp(lambda t: t.get("session") or "—")
    by_day = grp(lambda t: WEEKDAYS[_parse_at(t).weekday()])
    by_symbol = grp(lambda t: (t.get("symbol") or "—").upper())
    by_setup = grp(lambda t: t.get("setup") or "—")

    return {
        "total": n,
        "wins": len(wins),
        "losses": len(losses),
        "winrate": round(100 * winrate, 1),
        "expectancy": round(expectancy, 3),
        "avg_win_r": round(avg_win_r, 2),
        "avg_loss_r": round(avg_loss_r, 2),
        "total_pnl": round(sum(_pnl(t) for t in trades), 2),
        "avg_adx_winners": round(statistics.mean([t["adx"] for t in wins   if t.get("adx") is not None]), 1) if any(t.get("adx") is not None for t in wins)   else 0.0,
        "avg_adx_losers":  round(statistics.mean([t["adx"] for t in losses if t.get("adx") is not None]), 1) if any(t.get("adx") is not None for t in losses) else 0.0,
        "avg_atr_winners": round(statistics.mean([t["atr"] for t in wins   if t.get("atr") is not None]), 4) if any(t.get("atr") is not None for t in wins)   else 0.0,
        "avg_atr_losers":  round(statistics.mean([t["atr"] for t in losses if t.get("atr") is not None]), 4) if any(t.get("atr") is not None for t in losses) else 0.0,
        "by_session": by_session,
        "by_day": by_day,
        "by_symbol": by_symbol,
        "by_setup": by_setup,
        "symbol_filter": symbol_filter,
    }


def probability_engine(trades: List[dict], symbol_filter: Optional[str] = None) -> Dict[str, Any]:
    """Heuristic edge calculator across multiple cuts of the journal.
    `symbol_filter` restricts to trades on that symbol (SPX/SILVER/GOLD/...)."""
    if symbol_filter:
        sf = symbol_filter.upper()
        trades = [t for t in trades if (t.get("symbol") or "").upper() == sf]
    if not trades:
        return {"setups": [], "context": [], "adx_buckets": [], "atr_buckets": [], "symbol_filter": symbol_filter}

    def edge(group: List[dict]):
        if not group:
            return None
        wins = sum(1 for t in group if _is_win(t))
        rs = [_r(t) for t in group if _r(t)]
        pnls = [_pnl(t) for t in group if _pnl(t)]
        n = len(group)
        return {
            "trades": n,
            "winrate": round(100 * wins / n, 1),
            "avg_r": round(statistics.mean(rs), 2) if rs else 0.0,
            "total_pnl": round(sum(pnls), 2),
            "edge_score": round((wins / n) * 100 + (statistics.mean(rs) if rs else 0) * 10, 2),
        }

    # Setup × side
    setups: Dict[tuple, List[dict]] = defaultdict(list)
    for t in trades:
        setups[((t.get("setup") or "—"), (t.get("side") or "—"))].append(t)
    setup_rows = []
    for (s, side), ts in setups.items():
        e = edge(ts)
        if e and e["trades"] >= 1:
            setup_rows.append({"setup": s, "side": side, **e})
    setup_rows.sort(key=lambda r: -r["edge_score"])

    # Context: session × day-of-week × symbol
    context: Dict[tuple, List[dict]] = defaultdict(list)
    for t in trades:
        d = _parse_at(t).weekday()
        context[(WEEKDAYS[d], t.get("session") or "—", (t.get("symbol") or "—").upper())].append(t)
    ctx_rows = []
    for (dy, ses, sym), ts in context.items():
        e = edge(ts)
        if e and e["trades"] >= 1:
            ctx_rows.append({"day": dy, "session": ses, "symbol": sym, **e})
    ctx_rows.sort(key=lambda r: -r["edge_score"])

    # ADX buckets — does my edge improve when ADX > 25 / 30?
    def bucket_adx(t):
        a = t.get("adx")
        if a is None:
            return None
        if a >= 35: return "ADX 35+"
        if a >= 25: return "ADX 25-35"
        if a >= 20: return "ADX 20-25"
        return "ADX <20"

    def bucket_atr(t):
        a = t.get("atr")
        e = t.get("entry")
        if a is None or not e:
            return None
        atr_pct = (a / e) * 100
        if atr_pct >= 1.5: return "Vol HIGH"
        if atr_pct >= 0.8: return "Vol NORMAL"
        return "Vol LOW"

    adx_buckets_data: Dict[str, List[dict]] = defaultdict(list)
    atr_buckets_data: Dict[str, List[dict]] = defaultdict(list)
    for t in trades:
        b = bucket_adx(t)
        if b:
            adx_buckets_data[b].append(t)
        b2 = bucket_atr(t)
        if b2:
            atr_buckets_data[b2].append(t)

    adx_rows = []
    for k, ts in adx_buckets_data.items():
        e = edge(ts)
        if e:
            adx_rows.append({"bucket": k, **e})
    adx_rows.sort(key=lambda r: -r["edge_score"])

    atr_rows = []
    for k, ts in atr_buckets_data.items():
        e = edge(ts)
        if e:
            atr_rows.append({"bucket": k, **e})
    atr_rows.sort(key=lambda r: -r["edge_score"])

    return {
        "setups": setup_rows[:30],
        "context": ctx_rows[:30],
        "adx_buckets": adx_rows,
        "atr_buckets": atr_rows,
        "symbol_filter": symbol_filter,
    }
