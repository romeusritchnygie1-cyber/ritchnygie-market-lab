from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional

from services.market import get_quote, get_quotes, SYMBOL_MAP, LABELS
from services.indicators import get_indicators
from services.regime import classify_regime
from services.calendar import get_economic_calendar
from services.news_service import get_combined_news, get_newsapi_headlines
from services.london_session import session_status
from services.fred_service import get_macro_panel, fetch_series
from services.ohlc import get_ohlc
from services.ratio import gold_silver_ratio
from services.market_engine import analyze as analyze_market
from services.journal import Trade, TradeCreate, TradeUpdate, trade_to_doc, doc_to_trade
from services.analytics import behavior_stats, probability_engine
from services.backtest import run_backtest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Ritchnygie Trading Lab API")
api_router = APIRouter(prefix="/api")

# ---------- groups used on the dashboard ----------
HERO_SYMBOL = "SPX"
TICKER_BAR = ["SPX", "SPY", "DJI", "VIX", "DXY", "TNX", "GOLD", "SILVER"]
MAG7 = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA"]
WATCHLIST = ["AMD", "ASML", "TSM", "GS", "MS", "BAC"]


@api_router.get("/")
async def root():
    return {"app": "Ritchnygie Trading Lab", "status": "ok"}


@api_router.get("/quote/{symbol}")
async def quote(symbol: str):
    return get_quote(symbol.upper())


@api_router.get("/quotes")
async def quotes(symbols: str = Query(..., description="Comma-separated tickers")):
    sym_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    return {"quotes": get_quotes(sym_list)}


@api_router.get("/dashboard/hero")
async def hero():
    """Live S&P 500 CFD-equivalent hero ticker."""
    q = get_quote(HERO_SYMBOL)
    q["instrument"] = "S&P 500 CFD"
    q["broker"] = "FundedNext"
    return q


@api_router.get("/dashboard/ticker-bar")
async def ticker_bar():
    return {"tickers": get_quotes(TICKER_BAR)}


@api_router.get("/dashboard/mag7")
async def mag7():
    return {"mag7": get_quotes(MAG7)}


@api_router.get("/dashboard/watchlist")
async def watchlist():
    return {"watchlist": get_quotes(WATCHLIST)}


@api_router.get("/indicators/{symbol}")
async def indicators(symbol: str):
    return get_indicators(symbol.upper())


@api_router.get("/regime")
async def regime():
    return classify_regime()


@api_router.get("/calendar")
async def calendar():
    return get_economic_calendar()


@api_router.get("/news")
async def news(category: str = "all", limit: int = 30):
    items = get_combined_news(category=category, limit=limit)
    if not items:
        items = await get_newsapi_headlines()
    return {"items": items}


@api_router.get("/news/spotlight/{symbol}")
async def news_spotlight(symbol: str, limit: int = 12):
    """Per-market news for the user's 3 traded markets (SPX / SILVER / GOLD)
    plus any other supported symbol (e.g. AAPL, NVDA)."""
    from services.market import get_news_for
    sym = symbol.upper()
    items = get_news_for(sym, limit=limit)
    # For broad indices the symbol-level news can be sparse — augment with
    # category-level macro/tech feeds for SPX.
    if sym in ("SPX", "SPY") and len(items) < limit:
        from services.news_service import get_combined_news
        macro = [n for n in get_combined_news("macro", limit=20) if n["title"] not in {i["title"] for i in items}]
        items += macro[: limit - len(items)]
    return {"symbol": sym, "items": items[:limit]}


@api_router.get("/london-session")
async def london():
    return session_status()


@api_router.get("/macro")
async def macro():
    return await get_macro_panel()


@api_router.get("/macro/{series_id}")
async def macro_series(series_id: str):
    data = await fetch_series(series_id.upper())
    if not data:
        raise HTTPException(status_code=404, detail="series not found")
    return data


@api_router.get("/ohlc/{symbol}")
async def ohlc(symbol: str, period: str = "3mo", interval: str = "1d"):
    return get_ohlc(symbol, period=period, interval=interval)


@api_router.get("/gold-silver-ratio")
async def gold_silver():
    return gold_silver_ratio()


@api_router.get("/market-engine/{symbol}")
async def market_engine(symbol: str):
    return analyze_market(symbol)


@api_router.get("/market-engine")
async def market_engine_multi(symbols: str = "SPX,SILVER,GOLD"):
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    return {sym: analyze_market(sym) for sym in syms}


@api_router.get("/symbols")
async def symbols():
    return {"symbols": [{"key": k, "label": LABELS.get(k, k), "yahoo": v} for k, v in SYMBOL_MAP.items()]}


# ============ JOURNAL ============
@api_router.post("/journal/trades", response_model=Trade)
async def create_trade(payload: TradeCreate):
    trade = Trade(**payload.model_dump())
    await db.trades.insert_one(trade_to_doc(trade))
    return trade


@api_router.get("/journal/trades")
async def list_trades(limit: int = 500):
    docs = await db.trades.find({}, {"_id": 0}).sort("traded_at", -1).to_list(limit)
    return {"trades": [doc_to_trade(d) for d in docs]}


@api_router.get("/journal/trades/{trade_id}", response_model=Trade)
async def get_trade(trade_id: str):
    doc = await db.trades.find_one({"id": trade_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="not found")
    return Trade(**doc_to_trade(doc))


@api_router.patch("/journal/trades/{trade_id}", response_model=Trade)
async def update_trade(trade_id: str, payload: TradeUpdate):
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "traded_at" in update and hasattr(update["traded_at"], "isoformat"):
        update["traded_at"] = update["traded_at"].isoformat()
    res = await db.trades.find_one_and_update(
        {"id": trade_id}, {"$set": update}, return_document=True, projection={"_id": 0}
    )
    if not res:
        raise HTTPException(status_code=404, detail="not found")
    return Trade(**doc_to_trade(res))


@api_router.delete("/journal/trades/{trade_id}")
async def delete_trade(trade_id: str):
    r = await db.trades.delete_one({"id": trade_id})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="not found")
    return {"deleted": trade_id}


# ============ ANALYTICS ============
@api_router.get("/journal/behavior")
async def behavior(symbol: Optional[str] = None):
    docs = await db.trades.find({}, {"_id": 0}).to_list(5000)
    return behavior_stats([doc_to_trade(d) for d in docs], symbol_filter=symbol)


@api_router.get("/journal/probability")
async def probability(symbol: Optional[str] = None):
    docs = await db.trades.find({}, {"_id": 0}).to_list(5000)
    return probability_engine([doc_to_trade(d) for d in docs], symbol_filter=symbol)


# ============ BACKTEST ============
@api_router.post("/backtest")
async def backtest(
    symbol: str,
    strategy: str = "regime_breakout",
    period: str = "2y",
    interval: str = "1d",
    adx_threshold: float = 25.0,
    rsi_buy: float = 30.0,
    rsi_sell: float = 60.0,
):
    return run_backtest(
        symbol=symbol,
        strategy=strategy,
        period=period,
        interval=interval,
        adx_threshold=adx_threshold,
        rsi_buy=rsi_buy,
        rsi_sell=rsi_sell,
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
