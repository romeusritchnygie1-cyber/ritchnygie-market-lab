"""Technical indicators: ATR, ADX, RSI computed from OHLC data."""
import pandas as pd
import numpy as np
from typing import Dict, Any
from .market import get_history


def _wilder_smooth(series: pd.Series, period: int) -> pd.Series:
    """Wilder's smoothing (used by ATR/ADX)."""
    return series.ewm(alpha=1 / period, adjust=False).mean()


def compute_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high, low, close = df["High"], df["Low"], df["Close"]
    prev_close = close.shift(1)
    tr = pd.concat([
        (high - low),
        (high - prev_close).abs(),
        (low - prev_close).abs(),
    ], axis=1).max(axis=1)
    return _wilder_smooth(tr, period)


def compute_adx(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high, low, close = df["High"], df["Low"], df["Close"]
    up_move = high.diff()
    down_move = -low.diff()
    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)
    plus_dm = pd.Series(plus_dm, index=df.index)
    minus_dm = pd.Series(minus_dm, index=df.index)

    atr = compute_atr(df, period)
    plus_di = 100 * _wilder_smooth(plus_dm, period) / atr.replace(0, np.nan)
    minus_di = 100 * _wilder_smooth(minus_dm, period) / atr.replace(0, np.nan)
    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan)
    return _wilder_smooth(dx, period)


def compute_rsi(df: pd.DataFrame, period: int = 14) -> pd.Series:
    close = df["Close"]
    delta = close.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = _wilder_smooth(gain, period)
    avg_loss = _wilder_smooth(loss, period)
    rs = avg_gain / avg_loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def get_indicators(symbol: str, period: str = "6mo") -> Dict[str, Any]:
    """Return latest ATR / ADX / RSI plus a brief interpretation."""
    df = get_history(symbol, period=period, interval="1d")
    if df.empty or len(df) < 30:
        return {"symbol": symbol, "error": "insufficient data"}

    atr = compute_atr(df).iloc[-1]
    adx = compute_adx(df).iloc[-1]
    rsi = compute_rsi(df).iloc[-1]
    last_close = df["Close"].iloc[-1]

    atr_pct = (atr / last_close) * 100 if last_close else 0

    rsi_state = "Neutral"
    if rsi >= 70:
        rsi_state = "Overbought"
    elif rsi <= 30:
        rsi_state = "Oversold"
    elif rsi >= 55:
        rsi_state = "Bullish"
    elif rsi <= 45:
        rsi_state = "Bearish"

    adx_state = "Choppy"
    if adx >= 40:
        adx_state = "Strong Trend"
    elif adx >= 25:
        adx_state = "Trending"
    elif adx >= 20:
        adx_state = "Weak Trend"

    return {
        "symbol": symbol,
        "atr": round(float(atr), 4),
        "atr_pct": round(float(atr_pct), 3),
        "adx": round(float(adx), 2),
        "rsi": round(float(rsi), 2),
        "rsi_state": rsi_state,
        "adx_state": adx_state,
        "close": round(float(last_close), 4),
    }
