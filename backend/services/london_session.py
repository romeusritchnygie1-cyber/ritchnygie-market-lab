"""London Session tracker — for Silver and SPX CFD intraday context."""
from datetime import datetime, timezone, time
from typing import Dict, Any

# London session: 08:00 – 16:30 London time (07:00 – 15:30 UTC during BST,
# 08:00 – 16:30 UTC during winter). We use UTC 07:00–16:00 as a sensible window.
LONDON_OPEN_UTC = 7   # 07:00 UTC
LONDON_CLOSE_UTC = 16  # 16:00 UTC

# Overlap with NY (most volatile) ~ 13:00 – 16:00 UTC
NY_OVERLAP_OPEN = 13
NY_OVERLAP_CLOSE = 16


def session_status() -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    h = now.hour + now.minute / 60.0

    in_london = LONDON_OPEN_UTC <= h < LONDON_CLOSE_UTC
    in_overlap = NY_OVERLAP_OPEN <= h < NY_OVERLAP_CLOSE

    # Defaults — guarantees `phase`/`intensity` are always defined.
    phase: str = "Off-Session"
    intensity: str = "quiet"

    if in_overlap:
        phase = "London + NY Overlap"
        intensity = "peak"
    elif in_london:
        phase = "London Session"
        intensity = "active"

    # Time until next open / close
    if in_london:
        mins_to_close = int((LONDON_CLOSE_UTC - h) * 60)
        ttl = f"{mins_to_close // 60}h {mins_to_close % 60}m to close"
    else:
        # next open
        if h < LONDON_OPEN_UTC:
            mins = int((LONDON_OPEN_UTC - h) * 60)
        else:
            mins = int((24 - h + LONDON_OPEN_UTC) * 60)
        ttl = f"{mins // 60}h {mins % 60}m to open"

    return {
        "phase": phase,
        "intensity": intensity,
        "in_session": in_london,
        "in_overlap": in_overlap,
        "ttl": ttl,
        "now_utc": now.strftime("%H:%M UTC"),
        "open_utc": f"{LONDON_OPEN_UTC:02d}:00",
        "close_utc": f"{LONDON_CLOSE_UTC:02d}:00",
    }
