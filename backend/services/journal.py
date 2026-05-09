"""Trade Journal: CRUD for logged trades + aggregations."""
from datetime import datetime, timezone
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict
import uuid


class TradeBase(BaseModel):
    symbol: str
    side: Literal["long", "short"]
    session: Literal["london", "ny", "asia", "overlap", "off"] = "london"
    setup: Optional[str] = None         # e.g. "macro range break", "regime flip"
    entry: float
    exit: Optional[float] = None
    size: Optional[float] = None
    stop: Optional[float] = None
    target: Optional[float] = None
    pnl: Optional[float] = None
    r_multiple: Optional[float] = None  # realized R
    result: Optional[Literal["win", "loss", "breakeven"]] = None
    adx: Optional[float] = None         # ADX(14) at entry
    atr: Optional[float] = None         # ATR(14) at entry (absolute price units)
    regime: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    screenshot_url: Optional[str] = None
    traded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Trade(TradeBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TradeCreate(TradeBase):
    pass


class TradeUpdate(BaseModel):
    symbol: Optional[str] = None
    side: Optional[Literal["long", "short"]] = None
    session: Optional[Literal["london", "ny", "asia", "overlap", "off"]] = None
    setup: Optional[str] = None
    entry: Optional[float] = None
    exit: Optional[float] = None
    size: Optional[float] = None
    stop: Optional[float] = None
    target: Optional[float] = None
    pnl: Optional[float] = None
    r_multiple: Optional[float] = None
    result: Optional[Literal["win", "loss", "breakeven"]] = None
    adx: Optional[float] = None
    atr: Optional[float] = None
    regime: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    screenshot_url: Optional[str] = None
    traded_at: Optional[datetime] = None


def trade_to_doc(t: Trade) -> dict:
    d = t.model_dump()
    d["traded_at"] = d["traded_at"].isoformat() if isinstance(d["traded_at"], datetime) else d["traded_at"]
    d["created_at"] = d["created_at"].isoformat() if isinstance(d["created_at"], datetime) else d["created_at"]
    return d


def doc_to_trade(d: dict) -> dict:
    """Strip _id and parse dates back to datetimes."""
    d = {k: v for k, v in d.items() if k != "_id"}
    for f in ("traded_at", "created_at"):
        if f in d and isinstance(d[f], str):
            try:
                d[f] = datetime.fromisoformat(d[f])
            except Exception:
                pass
    return d
