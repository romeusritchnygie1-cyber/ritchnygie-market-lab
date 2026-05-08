import { useState } from "react";
import Header from "@/components/Header";
import TickerStrip from "@/components/TickerStrip";
import HeroDual from "@/components/HeroDual";
import Mag7Heatmap from "@/components/Mag7Heatmap";
import RegimeCard from "@/components/RegimeCard";
import EconomicCalendar from "@/components/EconomicCalendar";
import NewsFeed from "@/components/NewsFeed";
import IndicatorsPanel from "@/components/IndicatorsPanel";
import LondonSession from "@/components/LondonSession";
import MacroPanel from "@/components/MacroPanel";
import TradingViewWidget from "@/components/TradingViewWidget";

const CHART_SYMBOLS = [
    { sym: "FOREXCOM:SPXUSD",  label: "S&P 500 CFD",  short: "SPX",    color: "#60a5fa" },
    { sym: "OANDA:XAUUSD",     label: "Gold",          short: "GOLD",   color: "#fbbf24" },
    { sym: "OANDA:XAGUSD",     label: "Silver",        short: "SILVER", color: "#22d3ee" },
    { sym: "TVC:DXY",          label: "DXY",           short: "DXY",    color: "#c084fc" },
    { sym: "TVC:VIX",          label: "VIX",           short: "VIX",    color: "#f87171" },
    { sym: "TVC:US10Y",        label: "10Y Yield",     short: "TNX",    color: "#fb923c" },
    { sym: "FOREXCOM:US30",    label: "Dow Jones",     short: "DJI",    color: "#34d399" },
    { sym: "NASDAQ:NVDA",      label: "Nvidia",        short: "NVDA",   color: "#fb923c" },
    { sym: "NASDAQ:AAPL",      label: "Apple",         short: "AAPL",   color: "#60a5fa" },
    { sym: "NASDAQ:MSFT",      label: "Microsoft",     short: "MSFT",   color: "#22d3ee" },
    { sym: "NASDAQ:TSLA",      label: "Tesla",         short: "TSLA",   color: "#f87171" },
    { sym: "NASDAQ:AMD",       label: "AMD",           short: "AMD",    color: "#ec4899" },
    { sym: "NASDAQ:ASML",      label: "ASML",          short: "ASML",   color: "#a3e635" },
    { sym: "NYSE:GS",          label: "Goldman Sachs", short: "GS",     color: "#fde047" },
    { sym: "NYSE:MS",          label: "Morgan Stanley", short: "MS",    color: "#60a5fa" },
];

const TIMEFRAMES = [
    { label: "5m",  v: "5"   },
    { label: "15m", v: "15"  },
    { label: "1H",  v: "60"  },
    { label: "4H",  v: "240" },
    { label: "D",   v: "D"   },
    { label: "W",   v: "W"   },
];

export default function Dashboard() {
    const [chartSym, setChartSym] = useState(CHART_SYMBOLS[0]);
    const [tf, setTf] = useState(TIMEFRAMES[2]);

    return (
        <div className="min-h-screen rtl-bg-base" data-testid="dashboard">
            <Header />
            <TickerStrip />

            <main className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-8">
                {/* Page heading */}
                <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
                    <div>
                        <div className="rtl-eyebrow rtl-eyebrow-strong">Macro Trading Intelligence</div>
                        <h1 className="font-headings font-bold text-4xl md:text-5xl tracking-tight mt-2">
                            Trading Terminal
                        </h1>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="rtl-eyebrow">Strategy</div>
                        <div className="text-base txt-sec font-mono mt-1">Macro · CFD · London Session</div>
                    </div>
                </div>

                {/* Dual Hero — SPX (navy) + Gold (amber) */}
                <section className="mb-3"><HeroDual /></section>

                {/* Regime + London */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3">
                    <div className="lg:col-span-8"><RegimeCard /></div>
                    <div className="lg:col-span-4"><LondonSession /></div>
                </section>

                {/* SINGLE TradingView Chart — switches between SPX, Gold, Silver, DXY, etc. */}
                <section className="mb-3 rtl-card-pro" data-testid="chart-section">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-rtl-soft flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className="rtl-eyebrow rtl-eyebrow-strong">Pro Chart</div>
                            <div className="font-mono text-base" style={{ color: chartSym.color }}>
                                {chartSym.short}
                            </div>
                            <div className="font-mono text-sm txt-sec">·  {chartSym.label}  ·  {tf.label}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                            <div className="flex gap-1 mr-3 pr-3 border-r border-rtl-soft">
                                {TIMEFRAMES.map((t) => (
                                    <button
                                        key={t.v}
                                        onClick={() => setTf(t)}
                                        data-testid={`tf-${t.label}`}
                                        className={`text-xs tracking-[0.18em] uppercase font-headings px-2.5 py-1 transition-colors ${
                                            tf.v === t.v
                                                ? "text-white bg-blue-500/20 border border-blue-500/50"
                                                : "txt-mute hover:text-white border border-transparent"
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            {CHART_SYMBOLS.map((s) => (
                                <button
                                    key={s.sym}
                                    onClick={() => setChartSym(s)}
                                    data-testid={`chart-sym-${s.short}`}
                                    className={`text-xs tracking-[0.20em] uppercase font-headings px-2.5 py-1 transition-colors border ${
                                        chartSym.sym === s.sym
                                            ? "text-white"
                                            : "txt-mute hover:text-white border-transparent"
                                    }`}
                                    style={chartSym.sym === s.sym
                                        ? { backgroundColor: s.color + "25", borderColor: s.color + "80", color: s.color }
                                        : {}
                                    }
                                >
                                    {s.short}
                                </button>
                            ))}
                        </div>
                    </div>
                    <TradingViewWidget
                        symbol={chartSym.sym}
                        interval={tf.v}
                        height={620}
                        instanceKey={`main-${chartSym.short}-${tf.v}`}
                    />
                </section>

                {/* Mag7 (multi-color) */}
                <section className="mb-3"><Mag7Heatmap /></section>

                {/* Macro panel */}
                <section className="mb-3"><MacroPanel /></section>

                {/* Indicators (colored) + Calendar */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3">
                    <div className="lg:col-span-6"><IndicatorsPanel /></div>
                    <div className="lg:col-span-6"><EconomicCalendar compact /></div>
                </section>

                {/* News */}
                <section className="mb-3"><NewsFeed limit={15} /></section>

                <footer className="mt-12 pt-6 border-t border-rtl-soft">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="text-xs tracking-[0.24em] uppercase txt-mute font-headings">
                            Ritchnygie Trading Lab · Macro Intelligence Terminal
                        </div>
                        <div className="text-xs tracking-[0.20em] uppercase txt-mute font-headings">
                            24/7 LIVE · SPX CFD · Gold · London Session
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
