"""OHLC endpoint for charts."""
from typing import Dict, Any, List
import pandas as pd
from .market import get_history


def get_ohlc(symbol: str, period: str = "3mo", interval: str = "1d") -> Dict[str, Any]:
    df = get_history(symbol.upper(), period=period, interval=interval)
    if df.empty:
        return {"symbol": symbol.upper(), "candles": [], "volume": []}

    candles: List[Dict[str, Any]] = []
    volume: List[Dict[str, Any]] = []
    for ts, row in df.iterrows():
        if pd.isna(row["Close"]):
            continue
        time_val = int(ts.timestamp())
        candles.append({
            "time": time_val,
            "open": round(float(row["Open"]), 4),
            "high": round(float(row["High"]), 4),
            "low": round(float(row["Low"]), 4),
            "close": round(float(row["Close"]), 4),
        })
        vol = float(row["Volume"]) if not pd.isna(row["Volume"]) else 0.0
        up = row["Close"] >= row["Open"]
        volume.append({
            "time": time_val,
            "value": vol,
            "color": "rgba(59,130,246,0.4)" if up else "rgba(239,68,68,0.4)",
        })

    return {"symbol": symbol.upper(), "candles": candles, "volume": volume, "interval": interval, "period": period}
