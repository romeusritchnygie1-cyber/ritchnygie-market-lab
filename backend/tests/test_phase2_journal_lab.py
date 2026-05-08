"""Phase 2 RTL: Journal CRUD, Behavior/Probability analytics, Backtester."""
import pytest
from datetime import datetime, timezone

TIMEOUT = 60  # backtests can take a few seconds


# ---------- Journal CRUD ----------
class TestJournalCRUD:
    """Trade Journal CRUD endpoints"""

    @classmethod
    def _payload(cls, **over):
        d = {
            "symbol": "SPX",
            "side": "long",
            "session": "london",
            "setup": "Macro range break",
            "entry": 4500.0,
            "exit": 4530.0,
            "stop": 4490.0,
            "target": 4540.0,
            "size": 1.0,
            "pnl": 30.0,
            "r_multiple": 1.5,
            "regime": "Trending",
            "notes": "TEST_phase2 entry",
            "tags": ["TEST", "phase2"],
            "screenshot_url": "https://example.com/x.png",
        }
        d.update(over)
        return d

    def test_create_trade_full_payload(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/journal/trades",
                            json=self._payload(), timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        # Field-level assertions
        assert "_id" not in d, "MongoDB _id leaked into response"
        assert d["symbol"] == "SPX"
        assert d["side"] == "long"
        assert d["session"] == "london"
        assert d["setup"] == "Macro range break"
        assert d["entry"] == 4500.0
        assert d["exit"] == 4530.0
        assert d["pnl"] == 30.0
        assert d["r_multiple"] == 1.5
        assert d["tags"] == ["TEST", "phase2"]
        assert "id" in d and isinstance(d["id"], str) and len(d["id"]) > 0
        assert "traded_at" in d
        assert "created_at" in d
        pytest.shared_trade_id = d["id"]

    def test_list_trades_sorted_desc(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/journal/trades", timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        assert "trades" in d and isinstance(d["trades"], list)
        assert len(d["trades"]) >= 1
        # verify _id excluded
        for t in d["trades"]:
            assert "_id" not in t
        # sort desc by traded_at
        ts = [t.get("traded_at") for t in d["trades"] if t.get("traded_at")]
        if len(ts) >= 2:
            assert ts == sorted(ts, reverse=True), "trades not sorted desc by traded_at"

    def test_get_trade_by_id(self, api_client, base_url):
        tid = getattr(pytest, "shared_trade_id", None)
        assert tid, "no shared trade id"
        r = api_client.get(f"{base_url}/api/journal/trades/{tid}", timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        assert "_id" not in d
        assert d["id"] == tid
        assert d["symbol"] == "SPX"
        assert d["pnl"] == 30.0

    def test_get_trade_not_found(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/journal/trades/__nope__", timeout=TIMEOUT)
        assert r.status_code == 404

    def test_patch_trade(self, api_client, base_url):
        tid = getattr(pytest, "shared_trade_id", None)
        assert tid
        r = api_client.patch(f"{base_url}/api/journal/trades/{tid}",
                             json={"exit": 4555.0, "pnl": 55.0, "r_multiple": 2.5},
                             timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["exit"] == 4555.0
        assert d["pnl"] == 55.0
        assert d["r_multiple"] == 2.5
        # GET to confirm persistence
        g = api_client.get(f"{base_url}/api/journal/trades/{tid}", timeout=TIMEOUT)
        assert g.status_code == 200
        gd = g.json()
        assert gd["pnl"] == 55.0
        assert gd["exit"] == 4555.0

    def test_create_extra_trades_for_analytics(self, api_client, base_url):
        """Seed a few different trades so behavior/probability return meaningful rows."""
        seeds = [
            {"symbol": "GOLD", "side": "short", "session": "ny",
             "setup": "VIX spike fade", "entry": 1900, "exit": 1880,
             "pnl": 20.0, "r_multiple": 1.0, "notes": "TEST_p2 g"},
            {"symbol": "SPX", "side": "short", "session": "london",
             "setup": "Mean reversion", "entry": 4500, "exit": 4520,
             "pnl": -20.0, "r_multiple": -1.0, "notes": "TEST_p2 loser"},
            {"symbol": "NVDA", "side": "long", "session": "ny",
             "setup": "Trend pullback", "entry": 500, "exit": 520,
             "pnl": 20.0, "r_multiple": 2.0, "notes": "TEST_p2 nvda"},
        ]
        ids = []
        for p in seeds:
            r = api_client.post(f"{base_url}/api/journal/trades", json=p, timeout=TIMEOUT)
            assert r.status_code == 200, r.text
            ids.append(r.json()["id"])
        pytest.seeded_ids = ids


# ---------- Analytics ----------
class TestAnalytics:
    """Behavior + Probability endpoints over the journal"""

    def test_behavior_stats(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/journal/behavior", timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        for k in ("total", "winrate", "expectancy", "avg_win_r", "avg_loss_r",
                  "by_session", "by_day", "by_symbol", "by_setup"):
            assert k in d, f"missing key {k}: {list(d.keys())}"
        assert d["total"] >= 4  # we created at least 4 above
        for bucket in ("by_session", "by_day", "by_symbol", "by_setup"):
            assert isinstance(d[bucket], list)
            assert len(d[bucket]) >= 1
            row = d[bucket][0]
            for k in ("key", "trades", "winrate", "avg_r", "total_pnl"):
                assert k in row, f"row missing {k}: {row}"
        # winrate is numeric percent
        assert isinstance(d["winrate"], (int, float))

    def test_probability_engine(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/journal/probability", timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        assert "setups" in d and isinstance(d["setups"], list)
        assert "context" in d and isinstance(d["context"], list)
        assert len(d["setups"]) >= 1
        assert len(d["context"]) >= 1
        sr = d["setups"][0]
        for k in ("setup", "side", "trades", "winrate", "avg_r", "edge_score"):
            assert k in sr, f"setup row missing {k}: {sr}"
        cr = d["context"][0]
        for k in ("day", "session", "symbol", "trades", "winrate", "edge_score"):
            assert k in cr, f"context row missing {k}: {cr}"
        # sorted desc by edge_score
        scores = [s["edge_score"] for s in d["setups"]]
        assert scores == sorted(scores, reverse=True), "setups not sorted by edge_score desc"


# ---------- Backtest ----------
class TestBacktest:
    def test_backtest_regime_breakout_spx(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/backtest",
                            params={"symbol": "SPX",
                                    "strategy": "regime_breakout",
                                    "period": "1y"}, timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("error") is None, f"backtest errored: {d}"
        assert d["symbol"] == "SPX"
        assert d["strategy"] == "regime_breakout"
        for k in ("equity_curve", "trades", "summary"):
            assert k in d, f"missing {k}"
        assert isinstance(d["equity_curve"], list) and len(d["equity_curve"]) > 50
        # equity curve points
        p = d["equity_curve"][0]
        for k in ("time", "value"):
            assert k in p, f"equity_curve point missing {k}: {p}"
        # summary
        s = d["summary"]
        for k in ("initial", "final", "return_pct", "max_dd_pct", "trades", "winrate"):
            assert k in s, f"summary missing {k}"
        assert isinstance(s["trades"], int)
        # initial should be ~10000
        assert s["initial"] > 0

    def test_backtest_mean_reversion_spx(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/backtest",
                            params={"symbol": "SPX",
                                    "strategy": "mean_reversion",
                                    "period": "1y",
                                    "rsi_buy": 30,
                                    "rsi_sell": 60}, timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("error") is None, f"mean_reversion errored: {d}"
        assert d["strategy"] == "mean_reversion"
        assert "summary" in d and "equity_curve" in d
        assert len(d["equity_curve"]) > 20


# ---------- Cleanup + DELETE verification ----------
class TestDeleteCleanup:
    def test_delete_trade_and_verify(self, api_client, base_url):
        tid = getattr(pytest, "shared_trade_id", None)
        assert tid
        r = api_client.delete(f"{base_url}/api/journal/trades/{tid}", timeout=TIMEOUT)
        assert r.status_code == 200
        assert r.json().get("deleted") == tid
        # GET should now 404
        g = api_client.get(f"{base_url}/api/journal/trades/{tid}", timeout=TIMEOUT)
        assert g.status_code == 404

    def test_delete_seeded_trades(self, api_client, base_url):
        for tid in getattr(pytest, "seeded_ids", []):
            r = api_client.delete(f"{base_url}/api/journal/trades/{tid}", timeout=TIMEOUT)
            assert r.status_code in (200, 404)

    def test_delete_not_found(self, api_client, base_url):
        r = api_client.delete(f"{base_url}/api/journal/trades/__nope__", timeout=TIMEOUT)
        assert r.status_code == 404
