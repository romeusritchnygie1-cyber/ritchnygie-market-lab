"""Session Matrix — per-asset trading windows.

User's preferences (Feb 2026):
  • SPX: New York active hours, 11:00 – 15:45 ET (the high-volume mid/late session)
  • Silver: London session (08:00 – 16:00 London local)
  • Gold: BOTH London + NY (full liquidity day)

Returns a per-asset status with in-window flags, optimal-now flag, time-to-open/close.
"""
from __future__ import annotations
from datetime import datetime, time
from typing import Dict, Any, List
from zoneinfo import ZoneInfo

NY_TZ = ZoneInfo("America/New_York")
LDN_TZ = ZoneInfo("Europe/London")

# Asset windows expressed in their local timezone
ASSET_WINDOWS = [
    {
        "asset": "SPX",
        "label": "S&P 500",
        "broker": "FundedNext · CFD",
        "color": "#60a5fa",
        "windows": [
            {"name": "NY Active", "tz": "America/New_York", "open": time(11, 0), "close": time(15, 45)},
        ],
        "rationale": "Mid/late NY session — highest SPX-CFD volume window for FundedNext execution.",
    },
    {
        "asset": "SILVER",
        "label": "Silver",
        "broker": "FTMO · OANDA",
        "color": "#67e8f9",
        "windows": [
            {"name": "London", "tz": "Europe/London", "open": time(8, 0), "close": time(16, 0)},
        ],
        "rationale": "London open drives industrial-metal flow; XAGUSD breakouts cluster here.",
    },
    {
        "asset": "GOLD",
        "label": "Gold",
        "broker": "FTMO · OANDA",
        "color": "#fbbf24",
        "windows": [
            {"name": "London", "tz": "Europe/London", "open": time(8, 0), "close": time(16, 0)},
            {"name": "NY Active", "tz": "America/New_York", "open": time(11, 0), "close": time(15, 45)},
        ],
        "rationale": "Both London + NY — gold is the macro hedge, traded around the clock.",
    },
]


def _minutes_until(now_local: datetime, target: time) -> int:
    """Minutes from now_local until target time today (or tomorrow if past)."""
    target_today = now_local.replace(hour=target.hour, minute=target.minute, second=0, microsecond=0)
    diff = (target_today - now_local).total_seconds() / 60
    if diff < 0:
        diff += 24 * 60
    return int(diff)


def _humanize(mins: int) -> str:
    if mins <= 0:
        return "now"
    h, m = divmod(mins, 60)
    if h == 0:
        return f"{m}m"
    return f"{h}h {m}m"


def _evaluate_window(now_utc: datetime, window: Dict[str, Any]) -> Dict[str, Any]:
    tz = ZoneInfo(window["tz"])
    now_local = now_utc.astimezone(tz)
    today_local = now_local.date()
    open_dt = datetime.combine(today_local, window["open"]).replace(tzinfo=tz)
    close_dt = datetime.combine(today_local, window["close"]).replace(tzinfo=tz)

    in_window = open_dt <= now_local < close_dt

    if in_window:
        mins_remaining = int((close_dt - now_local).total_seconds() / 60)
        status = "open"
        countdown = f"{_humanize(mins_remaining)} to close"
    else:
        if now_local < open_dt:
            mins_to_open = int((open_dt - now_local).total_seconds() / 60)
        else:
            # past close — wait until tomorrow's open
            tomorrow_open = datetime.combine(today_local, window["open"]).replace(tzinfo=tz)
            mins_to_open = int((tomorrow_open - now_local).total_seconds() / 60) + 24 * 60
        status = "closed"
        countdown = f"{_humanize(mins_to_open)} to open"

    return {
        "name": window["name"],
        "tz_label": "ET" if "New_York" in window["tz"] else "UK",
        "open_local": window["open"].strftime("%H:%M"),
        "close_local": window["close"].strftime("%H:%M"),
        "now_local": now_local.strftime("%H:%M"),
        "status": status,
        "countdown": countdown,
        "in_window": in_window,
    }


def get_session_matrix() -> Dict[str, Any]:
    """Return per-asset session status."""
    now_utc = datetime.now(ZoneInfo("UTC"))
    # Weekday in NY (markets close Fri ~17:00 ET, reopen Sun ~17:00 ET)
    now_ny = now_utc.astimezone(NY_TZ)
    weekday = now_ny.weekday()  # 0=Mon ... 5=Sat, 6=Sun
    # Weekend window: Saturday all day OR Sunday before 17:00 ET OR Friday after 17:00 ET
    is_weekend = (
        weekday == 5
        or (weekday == 6 and now_ny.hour < 17)
        or (weekday == 4 and now_ny.hour >= 17)
    )

    assets: List[Dict[str, Any]] = []

    for cfg in ASSET_WINDOWS:
        windows = [_evaluate_window(now_utc, w) for w in cfg["windows"]]
        any_in = any(w["in_window"] for w in windows) and not is_weekend
        # Pick "active" window (the one currently open, or the next opening)
        active_window = next((w for w in windows if w["in_window"]), None)
        if is_weekend:
            primary_status = "WEEKEND"
            primary_countdown = "Sun 17:00 ET reopen"
            primary_window_name = "Closed"
        elif active_window:
            primary_status = "ACTIVE"
            primary_countdown = active_window["countdown"]
            primary_window_name = active_window["name"]
        else:
            # next-to-open
            next_w = min(windows, key=lambda w: w["countdown"])
            primary_status = "WAITING"
            primary_countdown = next_w["countdown"]
            primary_window_name = next_w["name"]

        assets.append({
            "asset": cfg["asset"],
            "label": cfg["label"],
            "broker": cfg["broker"],
            "color": cfg["color"],
            "rationale": cfg["rationale"],
            "in_optimal_window": any_in,
            "primary_status": primary_status,
            "primary_countdown": primary_countdown,
            "primary_window_name": primary_window_name,
            "windows": windows,
        })

    # Composite headline — what should the user trade RIGHT NOW?
    active_assets = [a["asset"] for a in assets if a["in_optimal_window"]]
    if is_weekend:
        headline = "Weekend — markets closed. Use this time to journal, plan, and review last week's trades."
    elif not active_assets:
        headline = "All optimal windows closed — patience. Use this time to journal & plan."
    elif len(active_assets) == 1:
        labels = {"SPX": "S&P 500 (NY active)", "SILVER": "Silver (London)", "GOLD": "Gold"}
        headline = f"Trade window OPEN for {labels.get(active_assets[0], active_assets[0])}."
    else:
        headline = f"{len(active_assets)} markets in their optimal window — focus on highest-edge setup."

    return {
        "now_utc": now_utc.strftime("%Y-%m-%d %H:%M UTC"),
        "is_weekend": is_weekend,
        "assets": assets,
        "active_count": len(active_assets),
        "headline": headline,
    }
