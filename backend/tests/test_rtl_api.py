"""End-to-end backend API tests for Ritchnygie Trading Lab (RTL)."""
import pytest

TIMEOUT = 30  # yfinance can be slow on first call


# ---------- helpers ----------
def _is_num(v):
    return isinstance(v, (int, float)) and v is not None


# ---------- root / health ----------
class TestRoot:
    def test_root(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/", timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        assert d["app"] == "Ritchnygie Trading Lab"
        assert d["status"] == "ok"


# ---------- dashboard hero / ticker-bar / mag7 / watchlist ----------
class TestDashboard:
    def test_hero(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/dashboard/hero", timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        assert d.get("instrument") == "S&P 500 CFD"
        assert d.get("broker") == "FundedNext"
        assert "price" in d
        assert _is_num(d["price"])

    def test_ticker_bar(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/dashboard/ticker-bar", timeout=TIMEOUT)
        assert r.status_code == 200
        tickers = r.json().get("tickers", [])
        assert isinstance(tickers, list) and len(tickers) >= 6
        keys = {t.get("symbol") or t.get("key") for t in tickers}
        # Should include core macro tickers (allow flexibility on field name)
        wanted = {"SPX", "VIX", "DXY", "GOLD", "SILVER"}
        assert wanted.intersection(keys), f"missing core tickers, got {keys}"

    def test_mag7(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/dashboard/mag7", timeout=TIMEOUT)
        assert r.status_code == 200
        m = r.json().get("mag7", [])
        assert len(m) == 7
        for q in m:
            assert "price" in q
            assert "change_pct" in q

    def test_watchlist(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/dashboard/watchlist", timeout=TIMEOUT)
        assert r.status_code == 200
        w = r.json().get("watchlist", [])
        assert len(w) == 6
        symbols = {q.get("symbol") for q in w}
        assert {"AMD", "ASML", "TSM", "GS", "MS", "BAC"}.issubset(symbols)


# ---------- quote / quotes ----------
class TestQuotes:
    def test_quote_aapl(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/quote/AAPL", timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        for k in ("price", "change", "change_pct"):
            assert k in d, f"missing {k}"
        assert _is_num(d["price"])

    def test_quotes_multi(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/quotes", params={"symbols": "NVDA,GS"}, timeout=TIMEOUT)
        assert r.status_code == 200
        qs = r.json().get("quotes", [])
        assert len(qs) == 2
        syms = {q.get("symbol") for q in qs}
        assert syms == {"NVDA", "GS"}


# ---------- indicators ----------
class TestIndicators:
    def test_indicators_spx(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/indicators/SPX", timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        lower = {k.lower(): v for k, v in d.items()}
        for k in ("atr", "adx", "rsi"):
            assert k in lower, f"missing indicator {k}: keys={list(d.keys())}"
            assert _is_num(lower[k])
        # adx_state and rsi_state exist (atr_state may not — ATR uses atr_pct)
        assert "adx_state" in lower
        assert "rsi_state" in lower


# ---------- regime ----------
class TestRegime:
    def test_regime(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/regime", timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        assert "primary" in d
        assert "tags" in d and isinstance(d["tags"], list)
        assert "signals" in d and isinstance(d["signals"], list)
        sig_names = {s.get("name", "").upper() for s in d["signals"]}
        # Spec says ADX, VIX and Risk Composite signals must be present
        assert any("ADX" in n for n in sig_names), f"ADX signal missing: {sig_names}"
        assert any("VIX" in n for n in sig_names), f"VIX signal missing: {sig_names}"
        assert any("RISK" in n for n in sig_names), f"Risk Composite signal missing: {sig_names}"


# ---------- calendar ----------
class TestCalendar:
    def test_calendar(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/calendar", timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d, dict)
        # response-level risk_warning field (may be null)
        assert "risk_warning" in d
        events = d.get("events", [])
        assert isinstance(events, list) and len(events) > 0
        titles = " | ".join(
            (e.get("name") or e.get("title") or e.get("event") or "") for e in events
        ).lower()
        assert "cpi" in titles, f"CPI missing in {titles}"
        assert "non-farm" in titles or "nfp" in titles, "NFP missing"
        assert "fomc" in titles, "FOMC missing"
        for e in events:
            assert "hours_until" in e
            assert "humanize" in e


# ---------- london session ----------
class TestLondonSession:
    def test_london(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/london-session", timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        for k in ("phase", "intensity", "in_session", "ttl", "now_utc"):
            assert k in d, f"missing {k}"


# ---------- macro / FRED ----------
class TestMacro:
    def test_macro_panel(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/macro", timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        for sid in ("FEDFUNDS", "DGS10", "DGS2", "UNRATE", "CPIAUCSL"):
            assert sid in d, f"missing series {sid}"
            block = d[sid]
            assert _is_num(block.get("value")), f"{sid} value not numeric: {block}"

    def test_macro_single(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/macro/FEDFUNDS", timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        for k in ("value", "date", "change"):
            assert k in d, f"missing {k}"
        assert _is_num(d["value"])


# ---------- news ----------
class TestNews:
    def test_news_institutional(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/news",
                           params={"category": "institutional", "limit": 5},
                           timeout=TIMEOUT)
        assert r.status_code == 200
        items = r.json().get("items", [])
        assert isinstance(items, list)
        if items:
            it = items[0]
            for k in ("title", "publisher", "url", "tag", "category"):
                assert k in it, f"news item missing field {k}: {it}"


# ---------- symbols ----------
class TestSymbols:
    def test_symbols(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/symbols", timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        syms = d.get("symbols", [])
        assert isinstance(syms, list) and len(syms) > 0
        spx = next((s for s in syms if s.get("key") == "SPX"), None)
        assert spx is not None and spx.get("yahoo") == "^GSPC"
