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

// TradingView symbols — using CFD/spot tickers that match what the user actually trades
const CHART_SYMBOLS = [
    { sym: "FOREXCOM:SPXUSD",  label: "S&P 500 CFD",  short: "SPX" },
    { sym: "OANDA:XAUUSD",     label: "Gold",          short: "GOLD" },
    { sym: "OANDA:XAGUSD",     label: "Silver",        short: "SILVER" },
    { sym: "TVC:DXY",          label: "DXY",           short: "DXY" },
    { sym: "TVC:VIX",          label: "VIX",           short: "VIX" },
    { sym: "TVC:US10Y",        label: "10Y Yield",     short: "TNX" },
    { sym: "FOREXCOM:US30",    label: "Dow Jones",     short: "DJI" },
    { sym: "NASDAQ:NVDA",      label: "Nvidia",        short: "NVDA" },
    { sym: "NASDAQ:AAPL",      label: "Apple",         short: "AAPL" },
    { sym: "NASDAQ:MSFT",      label: "Microsoft",     short: "MSFT" },
    { sym: "NASDAQ:TSLA",      label: "Tesla",         short: "TSLA" },
    { sym: "NASDAQ:AMD",       label: "AMD",           short: "AMD" },
    { sym: "NASDAQ:ASML",      label: "ASML",          short: "ASML" },
    { sym: "NYSE:GS",          label: "Goldman Sachs", short: "GS" },
    { sym: "NYSE:MS",          label: "Morgan Stanley", short: "MS" },
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

            <main className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-6">
                {/* Dual Hero — SPX + Gold */}
                <section className="mb-3"><HeroDual /></section>

                {/* Regime + London session quick row */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3">
                    <div className="lg:col-span-8"><RegimeCard /></div>
                    <div className="lg:col-span-4"><LondonSession /></div>
                </section>

                {/* Dual TradingView Charts: SPX + Gold side by side */}
                <section className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-3" data-testid="dual-chart-section">
                    <div className="rtl-card-pro" data-testid="chart-spx">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-rtl-soft">
                            <div className="flex items-center gap-3">
                                <div className="rtl-eyebrow rtl-eyebrow-strong">Primary · S&P 500 CFD</div>
                                <span className="text-[10px] tracking-[0.18em] uppercase font-headings txt-up">{tf.label}</span>
                            </div>
                            <div className="flex gap-1">
                                {TIMEFRAMES.map((t) => (
                                    <button
                                        key={t.v}
                                        onClick={() => setTf(t)}
                                        data-testid={`tf-${t.label}`}
                                        className={`text-[9px] tracking-[0.22em] uppercase font-headings px-1.5 py-0.5 transition-colors ${
                                            tf.v === t.v ? "text-white bg-rtl-up/15 border border-rtl-up/40" : "txt-mute hover:text-white border border-transparent"
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <TradingViewWidget
                            symbol="FOREXCOM:SPXUSD"
                            interval={tf.v}
                            height={460}
                            instanceKey={`spx-main-${tf.v}`}
                        />
                    </div>

                    <div className="rtl-card-pro" data-testid="chart-gold">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-rtl-soft">
                            <div className="flex items-center gap-3">
                                <div className="rtl-eyebrow rtl-eyebrow-strong" style={{ color: "var(--rtl-accent)" }}>Commodity · Gold</div>
                                <span className="text-[10px] tracking-[0.18em] uppercase font-headings txt-accent">{tf.label}</span>
                            </div>
                            <div className="text-[9px] tracking-[0.22em] uppercase font-headings txt-mute">
                                XAUUSD · OANDA
                            </div>
                        </div>
                        <TradingViewWidget
                            symbol="OANDA:XAUUSD"
                            interval={tf.v}
                            height={460}
                            instanceKey={`gold-main-${tf.v}`}
                        />
                    </div>
                </section>

                {/* Extra symbol chart (user choice) */}
                <section className="mb-3 rtl-card-pro" data-testid="chart-section">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-rtl-soft flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className="rtl-eyebrow rtl-eyebrow-strong">Macro Watchlist Chart</div>
                            <div className="font-mono text-[11px] txt-mute">
                                {chartSym.short} · {chartSym.label}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                            {CHART_SYMBOLS.map((s) => (
                                <button
                                    key={s.sym}
                                    onClick={() => setChartSym(s)}
                                    data-testid={`chart-sym-${s.short}`}
                                    className={`text-[10px] tracking-[0.22em] uppercase font-headings px-2 py-1 transition-colors ${
                                        chartSym.sym === s.sym
                                            ? "text-white bg-rtl-up/15 border border-rtl-up/40"
                                            : "txt-mute hover:text-white border border-transparent"
                                    }`}
                                >
                                    {s.short}
                                </button>
                            ))}
                        </div>
                    </div>
                    <TradingViewWidget
                        symbol={chartSym.sym}
                        interval={tf.v}
                        height={500}
                        instanceKey={`macro-${chartSym.short}-${tf.v}`}
                    />
                </section>

                {/* Mag7 */}
                <section className="mb-3"><Mag7Heatmap /></section>

                {/* Macro panel */}
                <section className="mb-3"><MacroPanel /></section>

                {/* Indicators + Calendar */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3">
                    <div className="lg:col-span-6"><IndicatorsPanel /></div>
                    <div className="lg:col-span-6"><EconomicCalendar compact /></div>
                </section>

                {/* News */}
                <section className="mb-3"><NewsFeed limit={15} /></section>

                <footer className="mt-10 pt-6 border-t border-rtl-soft">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="text-[9px] tracking-[0.28em] uppercase txt-mute font-headings">
                            Ritchnygie Trading Lab · Macro Intelligence Terminal
                        </div>
                        <div className="text-[9px] tracking-[0.22em] uppercase txt-mute font-headings">
                            24/7 LIVE · SPX CFD · Gold · London Session
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
