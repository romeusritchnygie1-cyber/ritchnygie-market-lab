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


@api_router.get("/symbols")
async def symbols():
    return {"symbols": [{"key": k, "label": LABELS.get(k, k), "yahoo": v} for k, v in SYMBOL_MAP.items()]}


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
