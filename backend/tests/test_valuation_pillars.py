"""Tests for new Valuation Engine + Macro Pillars endpoints (iteration 3)."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://sp500-macro-trader.preview.emergentagent.com").rstrip("/")
TIMEOUT = 90


# ---------- Macro Pillars ----------
class TestMacroPillars:
    def test_pillars_status_and_shape(self):
        r = requests.get(f"{BASE_URL}/api/macro-pillars", timeout=TIMEOUT)
        assert r.status_code == 200
        data = r.json()
        for k in ("inflation", "dxy", "vix", "spx_caution", "composite_color", "summary"):
            assert k in data, f"missing key {k}"
        assert isinstance(data["spx_caution"], bool)
        assert data["composite_color"] in ("red", "amber", "neutral", "green")

    def test_pillars_subobjects(self):
        data = requests.get(f"{BASE_URL}/api/macro-pillars", timeout=TIMEOUT).json()
        for key in ("inflation", "dxy", "vix"):
            sub = data[key]
            for f in ("name", "value", "color", "headline", "commentary"):
                assert f in sub, f"{key} missing {f}"
            assert sub["color"] in ("red", "amber", "neutral", "green")

    def test_cpi_hot_triggers_spx_caution(self):
        data = requests.get(f"{BASE_URL}/api/macro-pillars", timeout=TIMEOUT).json()
        cpi = data["inflation"].get("value")
        if cpi is not None and cpi > 3.0:
            assert data["inflation"]["spx_warning"] is True
            assert data["spx_caution"] is True
            assert data["inflation"]["color"] == "amber"


# ---------- Valuation Engine ----------
class TestValuation:
    def test_valuation_status_and_keys(self):
        r = requests.get(f"{BASE_URL}/api/valuation", timeout=TIMEOUT)
        assert r.status_code == 200
        data = r.json()
        for k in ("spx", "gold", "silver"):
            assert k in data

    def test_spx_valuation_shape(self):
        data = requests.get(f"{BASE_URL}/api/valuation", timeout=TIMEOUT).json()
        spx = data["spx"]
        for f in ("trailing_metric", "forward_metric", "signal", "color", "commentary", "components"):
            assert f in spx, f"spx missing {f}"
        assert isinstance(spx["components"], list)
        assert len(spx["components"]) >= 5
        comp0 = spx["components"][0]
        for f in ("symbol", "weight_pct", "trailing_pe", "forward_pe"):
            assert f in comp0
        assert spx["color"] in ("red", "amber", "neutral", "green")
        assert spx["signal"] in ("GROWTH BET", "CAUTION", "NEUTRAL", "UNKNOWN")

    def test_gold_silver_valuation(self):
        data = requests.get(f"{BASE_URL}/api/valuation", timeout=TIMEOUT).json()
        for sym in ("gold", "silver"):
            v = data[sym]
            for f in ("trailing_metric", "forward_metric", "signal", "color", "commentary"):
                assert f in v, f"{sym} missing {f}"
            assert v["color"] in ("red", "amber", "neutral", "green")


# ---------- Smoke regression: existing endpoints must still work ----------
class TestSmokeRegression:
    @pytest.mark.parametrize("path", [
        "/api/dashboard/hero",
        "/api/dashboard/ticker-bar",
        "/api/dashboard/mag7",
        "/api/regime",
        "/api/gold-silver-ratio",
        "/api/market-engine?symbols=SPX,SILVER,GOLD",
    ])
    def test_endpoint_200(self, path):
        r = requests.get(f"{BASE_URL}{path}", timeout=TIMEOUT)
        assert r.status_code == 200, f"{path} -> {r.status_code}"
        assert r.json() is not None
