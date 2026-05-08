"""Strategy Backtester: simple parametric strategy engine.

Two simple strategies you can replay on any of the supported symbols using
historical OHLC from yfinance:

1. `regime_breakout`: long when ADX > adx_threshold AND close > 20-day high.
2. `mean_reversion`: long when RSI < rsi_buy, exit when RSI > rsi_sell.

Returns equity curve, trade list, summary stats. This is *intentionally* a
simple engine for Phase 2 — Phase 3 will plug in the user's full macro setup.
"""
from typing import Dict, Any, List
import pandas as pd
import numpy as np
from .market import get_history
from .indicators import compute_adx, compute_rsi, compute_atr


def _summary(equity: pd.Series, trades: List[dict]) -> Dict[str, Any]:
    if equity.empty:
        return {"final": 0, "return_pct": 0, "max_dd": 0, "trades": 0, "winrate": 0}
    final = float(equity.iloc[-1])
    initial = float(equity.iloc[0])
    ret_pct = (final / initial - 1) * 100 if initial else 0
    rolling_max = equity.cummax()
    drawdowns = (equity - rolling_max) / rolling_max * 100
    max_dd = float(drawdowns.min())
    wins = [t for t in trades if t["pnl"] > 0]
    winrate = (len(wins) / len(trades) * 100) if trades else 0
    return {
        "initial": round(initial, 2),
        "final": round(final, 2),
        "return_pct": round(ret_pct, 2),
        "max_dd_pct": round(max_dd, 2),
        "trades": len(trades),
        "winrate": round(winrate, 1),
    }


def run_backtest(symbol: str, strategy: str = "regime_breakout",
                 period: str = "2y", interval: str = "1d",
                 adx_threshold: float = 25.0,
                 rsi_buy: float = 30.0, rsi_sell: float = 60.0) -> Dict[str, Any]:
    df = get_history(symbol.upper(), period=period, interval=interval)
    if df.empty or len(df) < 60:
        return {"error": "insufficient data", "symbol": symbol}

    df = df.copy()
    df["adx"] = compute_adx(df)
    df["rsi"] = compute_rsi(df)
    df["atr"] = compute_atr(df)
    df["hh20"] = df["High"].rolling(20).max().shift(1)

    equity = 10000.0
    eq_curve: List[Dict[str, Any]] = []
    trades: List[Dict[str, Any]] = []
    in_pos = False
    entry_price = 0.0
    entry_date = None
    qty = 0.0

    for i in range(len(df)):
        row = df.iloc[i]
        date = df.index[i]
        close = float(row["Close"])
        if pd.isna(close):
            continue

        signal_long = False
        signal_exit = False

        if strategy == "regime_breakout":
            if not in_pos and not pd.isna(row["adx"]) and not pd.isna(row["hh20"]):
                if row["adx"] >= adx_threshold and close >= row["hh20"]:
                    signal_long = True
            elif in_pos:
                # Exit when ADX falls below threshold or close < 10-day low (trailing)
                lookback_low = float(df["Low"].iloc[max(0, i - 10):i].min())
                if (not pd.isna(row["adx"]) and row["adx"] < (adx_threshold - 5)) or close < lookback_low:
                    signal_exit = True

        elif strategy == "mean_reversion":
            if not in_pos and not pd.isna(row["rsi"]) and row["rsi"] < rsi_buy:
                signal_long = True
            elif in_pos and not pd.isna(row["rsi"]) and row["rsi"] > rsi_sell:
                signal_exit = True

        if signal_long and not in_pos:
            qty = equity / close
            entry_price = close
            entry_date = str(date.date())
            in_pos = True

        elif signal_exit and in_pos:
            pnl = (close - entry_price) * qty
            equity += pnl
            r_mult = (close - entry_price) / (compute_atr(df).iloc[i] or 1)
            trades.append({
                "entry_date": entry_date,
                "exit_date": str(date.date()),
                "entry": round(entry_price, 4),
                "exit": round(close, 4),
                "pnl": round(pnl, 2),
                "r_multiple": round(float(r_mult), 2),
            })
            in_pos = False
            entry_price = 0.0
            qty = 0.0

        # Mark-to-market equity
        mtm = equity + ((close - entry_price) * qty if in_pos else 0)
        eq_curve.append({"time": int(date.timestamp()), "value": round(mtm, 2)})

    summary = _summary(pd.Series([p["value"] for p in eq_curve]), trades)

    return {
        "symbol": symbol.upper(),
        "strategy": strategy,
        "period": period,
        "interval": interval,
        "params": {"adx_threshold": adx_threshold, "rsi_buy": rsi_buy, "rsi_sell": rsi_sell},
        "equity_curve": eq_curve,
        "trades": trades,
        "summary": summary,
    }
