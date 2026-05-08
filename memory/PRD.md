# Ritchnygie Trading Lab (RTL) — PRD

## Original Problem Statement
User trades S&P 500 via CFD (FundedNext prop firm), runs a macro strategy across:
**Mag7, DXY, 10Y Treasury, Gold, Silver, Dow, SPY, SPX, VIX, AMD, ASML, TSM, Federal Reserve rate**.
Indicators on chart: ATR, ADX, RSI. Trades every day (only when conditions are clear),
favors London session and also trades Silver. Wants institutional/macro intelligence
(Goldman, Morgan Stanley, BofA news/earnings/intentions) and clear opportunity signals.

## User Personas
- **Primary**: Macro CFD trader (the user). Discretionary, intermarket, London-session focused.

## Brand & Design
- Name: **Ritchnygie Trading Lab** (short: **RTL**).
- Style: Bloomberg-meets-modern fintech, dark institutional terminal.
- Fonts: Cabinet Grotesk (headings) · IBM Plex Sans (body) · JetBrains Mono (data).
- Color rules: blue uptick `#3B82F6`, red downtick `#EF4444` — no retail green-on-black.

## Architecture
- **Frontend**: React 19 + Tailwind + shadcn/ui · pages: Dashboard / Watchlist / News (Intel) / Calendar.
- **Backend**: FastAPI · all routes prefixed `/api`.
- **Data sources** (free tier, no keys required for Phase 1):
  - **yfinance** → live quotes for SPX/SPY/VIX/DXY/Gold/Silver/Mag7/AMD/ASML/TSM/GS/MS/BAC + headlines.
  - **FRED public CSV** → Fed Funds, 10Y/2Y yields, Unemployment, CPI.
  - Optional env keys: `FINNHUB_KEY`, `NEWSAPI_KEY`, `FRED_API_KEY` (not required).
- **Database**: MongoDB (Phase 2 will use it for journal/strategy persistence).

## Phase 1 — Implemented (Feb 2026)
- [x] Hero S&P 500 CFD live ticker (FundedNext-branded).
- [x] Live ticker tape (SPX/SPY/DJI/VIX/DXY/10Y/Gold/Silver).
- [x] Mag7 Heatmap (color-intensity by % change).
- [x] Watchlist (AMD, ASML, TSM, GS, MS, BAC).
- [x] **Market Regime Engine** (Trending / Choppy / High Vol / Low Vol / Risk-On / Risk-Off / Low Liquidity / Mixed) with ADX, VIX, Risk-Composite signals.
- [x] **Economic Calendar Risk Filter** (CPI / PPI / NFP / FOMC / Retail Sales) with humanized countdown + warning banner when high-impact event < 24h.
- [x] Federal Reserve · Macro panel (FRED).
- [x] Indicators panel (ATR / ADX / RSI for SPX, Gold, Silver, DXY).
- [x] London Session tracker with NY-overlap visualization.
- [x] News & Institutional Intelligence (Goldman / Morgan Stanley / BofA / Mag7 / macro) with filters.
- [x] Multi-page nav: Terminal / Watchlist / Intel / Calendar.

## Phase 2 — Backlog (P0 next)
- [ ] **Trade Journal** — log entries with screenshots, tags, P&L, session.
- [ ] **Strategy Backtester** — run user's macro strategy on historical OHLC.
- [ ] **Probability Engine** — win-rate by setup × session × day-of-week.
- [ ] **Behavior Stats** — volatility, correlation matrix across watchlist.

## Phase 3 — Backlog (P1)
- [ ] **AI Clarity Score** — daily 0–100 score "is the market clear enough to trade".
- [ ] **AI Trade Scanner** — detects setups (range break / pullback / divergence).
- [ ] **AI Setup Detection** — auto-flags Silver London setups.
- [ ] **Probability Forecasting** — next-day directional probability with confidence.

## P2 / Nice-to-have
- [ ] User auth + per-user watchlists (Emergent Google Auth).
- [ ] Charting integration (TradingView lightweight charts).
- [ ] Push alerts when regime flips or high-impact event approaches.
- [ ] Mobile-optimized layout.

## Test Status
- Backend pytest: **100% (15/15)** — see `/app/backend/tests/test_rtl_api.py`.
- Frontend Playwright: **100%** — all pages render with live data.
