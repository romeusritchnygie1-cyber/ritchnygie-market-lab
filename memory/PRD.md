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
- [x] **Pro TradingView chart** with 15+ macro symbols (SPX CFD via FOREXCOM:SPXUSD, Silver via OANDA:XAGUSD, Gold via OANDA:XAUUSD, Mag7, banks). Timeframes 5m/15m/1H/4H/D/W. Built-in ATR/ADX/RSI studies.
- [x] Mag7 Heatmap (color-intensity by % change).
- [x] Watchlist (AMD, ASML, TSM, GS, MS, BAC) + dedicated chart on /watchlist page.
- [x] **Market Regime Engine** (Trending / Choppy / High Vol / Low Vol / Risk-On / Risk-Off / Low Liquidity / Mixed) with ADX, VIX, Risk-Composite signals.
- [x] **Economic Calendar Risk Filter** (CPI / PPI / NFP / FOMC / Retail Sales) with humanized countdown + warning banner when high-impact event < 24h.
- [x] Federal Reserve · Macro panel (FRED).
- [x] Indicators panel (ATR / ADX / RSI for SPX, Gold, Silver, DXY).
- [x] London Session tracker with NY-overlap visualization.
- [x] News & Institutional Intelligence (Goldman / Morgan Stanley / BofA / Mag7 / macro) with filters.
- [x] Multi-page nav: Terminal / Watchlist / Intel / Calendar.
- [x] Custom RTL SVG logo (geometric tick-pattern monogram).

## Phase 2 — Implemented (Feb 2026)
- [x] **Trade Journal** (full CRUD): symbol / side / session / setup / entry / exit / stop / target / size / pnl / r_multiple / regime / notes / tags / screenshot URL
- [x] **Behavior Stats**: winrate, expectancy, avg-win-R / avg-loss-R, breakdowns by Session × Day × Symbol × Setup
- [x] **Probability Engine**: edge_score ranking by (setup × side) and (day × session × symbol)
- [x] **Strategy Backtester**: regime_breakout (ADX + 20D high) and mean_reversion (RSI extremes), 1y / 2y / 5y, with equity curve, drawdown, P&L, winrate
- [x] All persisted in MongoDB; Lab page with lightweight-charts equity-curve viz

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
imized layout.

## Test Status
- Backend pytest: **100% (15/15)** — see `/app/backend/tests/test_rtl_api.py`.
- Frontend Playwright: **100%** — all pages render with live data.
