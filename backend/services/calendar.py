"""Economic Calendar with risk filter.
Phase 1: deterministically computes next CPI, NFP, FOMC dates from US calendar
patterns and tags impact level. Earnings pulled from upcoming Mag7/banks.
"""
from datetime import datetime, timedelta, timezone, date
from typing import List, Dict, Any
from calendar import monthrange


def _first_friday(year: int, month: int) -> date:
    d = date(year, month, 1)
    offset = (4 - d.weekday()) % 7  # Friday=4
    return d + timedelta(days=offset)


def _nth_weekday(year: int, month: int, weekday: int, n: int) -> date:
    """Return the nth weekday (Mon=0) of given month/year."""
    d = date(year, month, 1)
    offset = (weekday - d.weekday()) % 7
    return d + timedelta(days=offset + (n - 1) * 7)


def _next_cpi_release(today: date) -> date:
    """CPI typically releases ~10th-13th of the month, second Tuesday or Wednesday.
    We approximate with the second Wednesday."""
    candidate = _nth_weekday(today.year, today.month, 2, 2)  # 2nd Wednesday
    if candidate < today:
        nm = today.month + 1
        ny = today.year
        if nm > 12:
            nm = 1
            ny += 1
        candidate = _nth_weekday(ny, nm, 2, 2)
    return candidate


def _next_nfp_release(today: date) -> date:
    """NFP releases the first Friday of each month."""
    f = _first_friday(today.year, today.month)
    if f < today:
        nm = today.month + 1
        ny = today.year
        if nm > 12:
            nm = 1
            ny += 1
        f = _first_friday(ny, nm)
    return f


# Approximate FOMC meeting dates (real schedule published yearly by the Fed).
# Phase 1: maintain a static list of upcoming 2026 meeting dates.
FOMC_DATES_2026 = [
    date(2026, 1, 28),
    date(2026, 3, 18),
    date(2026, 4, 29),
    date(2026, 6, 17),
    date(2026, 7, 29),
    date(2026, 9, 16),
    date(2026, 10, 28),
    date(2026, 12, 9),
]


def _next_fomc(today: date) -> date:
    upcoming = [d for d in FOMC_DATES_2026 if d >= today]
    if upcoming:
        return upcoming[0]
    # Fallback: 6 weeks out
    return today + timedelta(weeks=6)


def get_economic_calendar() -> Dict[str, Any]:
    """Return upcoming high-impact macro events, sorted by time-to-event."""
    now = datetime.now(timezone.utc)
    today = now.date()

    events: List[Dict[str, Any]] = []

    cpi_d = _next_cpi_release(today)
    events.append({
        "name": "CPI Release",
        "category": "Inflation",
        "date": cpi_d.isoformat(),
        "time_utc": "12:30",
        "impact": "high",
        "description": "US Consumer Price Index — core driver of Fed policy expectations.",
    })

    nfp_d = _next_nfp_release(today)
    events.append({
        "name": "Non-Farm Payrolls",
        "category": "Employment",
        "date": nfp_d.isoformat(),
        "time_utc": "12:30",
        "impact": "high",
        "description": "US jobs report — large move catalyst for SPX, DXY and yields.",
    })

    fomc_d = _next_fomc(today)
    events.append({
        "name": "FOMC Decision",
        "category": "Monetary Policy",
        "date": fomc_d.isoformat(),
        "time_utc": "18:00",
        "impact": "high",
        "description": "Federal Reserve interest rate decision and statement.",
    })

    # Approximate next PPI (~mid-month, day after CPI typically)
    ppi_d = cpi_d + timedelta(days=1)
    events.append({
        "name": "PPI Release",
        "category": "Inflation",
        "date": ppi_d.isoformat(),
        "time_utc": "12:30",
        "impact": "medium",
        "description": "US Producer Price Index — leading inflation indicator.",
    })

    # Retail Sales (mid-month)
    retail_d = date(today.year, today.month, min(15, monthrange(today.year, today.month)[1]))
    if retail_d < today:
        nm = today.month + 1
        ny = today.year
        if nm > 12:
            nm, ny = 1, ny + 1
        retail_d = date(ny, nm, 15)
    events.append({
        "name": "Retail Sales",
        "category": "Consumer",
        "date": retail_d.isoformat(),
        "time_utc": "12:30",
        "impact": "medium",
        "description": "US retail sales — consumer spending health gauge.",
    })

    # Compute time-to-event in hours and human format
    for ev in events:
        ev_dt = datetime.fromisoformat(ev["date"]).replace(
            hour=int(ev["time_utc"].split(":")[0]),
            minute=int(ev["time_utc"].split(":")[1]),
            tzinfo=timezone.utc,
        )
        delta = ev_dt - now
        ev["hours_until"] = round(delta.total_seconds() / 3600, 1)
        ev["humanize"] = _humanize(delta)
        ev["risk_now"] = delta.total_seconds() < 6 * 3600 and delta.total_seconds() > 0

    events.sort(key=lambda e: e["hours_until"])

    # Risk warning if any high-impact event within 24h
    risk_warning = None
    elevated = [e for e in events if 0 < e["hours_until"] < 24 and e["impact"] == "high"]
    if elevated:
        next_ev = elevated[0]
        risk_warning = f"⚠ High-impact event: {next_ev['name']} in {next_ev['humanize']}. Consider lighter sizing or stand-aside."

    return {
        "events": events,
        "risk_warning": risk_warning,
        "generated_at": now.isoformat(),
    }


def _humanize(delta: timedelta) -> str:
    secs = delta.total_seconds()
    if secs < 0:
        return "passed"
    h = secs / 3600
    if h < 1:
        return f"{int(secs / 60)} min"
    if h < 24:
        return f"{h:.1f} hours"
    return f"{int(h / 24)} days"
