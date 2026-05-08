import { useState } from "react";
import Header from "@/components/Header";
import TickerStrip from "@/components/TickerStrip";
import WatchlistGrid from "@/components/WatchlistGrid";
import Mag7Heatmap from "@/components/Mag7Heatmap";
import IndicatorsPanel from "@/components/IndicatorsPanel";
import TradingViewWidget from "@/components/TradingViewWidget";

const SYMS = [
    { sym: "OANDA:XAGUSD",  label: "Silver",         short: "SILVER" },
    { sym: "OANDA:XAUUSD",  label: "Gold",           short: "GOLD"   },
    { sym: "NASDAQ:NVDA",   label: "Nvidia",         short: "NVDA"   },
    { sym: "NASDAQ:AAPL",   label: "Apple",          short: "AAPL"   },
    { sym: "NASDAQ:MSFT",   label: "Microsoft",      short: "MSFT"   },
    { sym: "NASDAQ:TSLA",   label: "Tesla",          short: "TSLA"   },
    { sym: "NASDAQ:AMD",    label: "AMD",            short: "AMD"    },
    { sym: "NASDAQ:ASML",   label: "ASML",           short: "ASML"   },
    { sym: "NYSE:TSM",      label: "TSMC",           short: "TSM"    },
    { sym: "NYSE:GS",       label: "Goldman Sachs",  short: "GS"     },
    { sym: "NYSE:MS",       label: "Morgan Stanley", short: "MS"     },
    { sym: "NYSE:BAC",      label: "Bank of America", short: "BAC"   },
];

export default function Watchlist() {
    const [s, setS] = useState(SYMS[0]);

    return (
        <div className="min-h-screen rtl-bg-base" data-testid="watchlist-page">
            <Header />
            <TickerStrip />

            <main className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-6">
                <div className="mb-6">
                    <div className="rtl-eyebrow">Watchlist</div>
                    <h1 className="font-headings font-bold text-3xl md:text-4xl tracking-tight mt-1">
                        Macro Watchlist
                    </h1>
                </div>

                <section className="mb-3 rtl-card-pro">
                    <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 border-b border-white/[0.06]">
                        <div className="flex items-center gap-3">
                            <div className="rtl-eyebrow rtl-eyebrow-strong">Watchlist Chart</div>
                            <div className="font-mono text-[11px] txt-mute">{s.short} · {s.label}</div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {SYMS.map((x) => (
                                <button
                                    key={x.sym}
                                    onClick={() => setS(x)}
                                    data-testid={`wl-sym-${x.short}`}
                                    className={`text-[10px] tracking-[0.22em] uppercase font-headings px-2 py-1 transition-colors ${
                                        s.sym === x.sym
                                            ? "text-white bg-blue-500/20 border border-blue-500/50"
                                            : "txt-mute hover:text-white border border-transparent"
                                    }`}
                                >
                                    {x.short}
                                </button>
                            ))}
                        </div>
                    </div>
                    <TradingViewWidget
                        symbol={s.sym}
                        interval="60"
                        height={520}
                        instanceKey={`wl-${s.short}`}
                    />
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    <section className="lg:col-span-12"><Mag7Heatmap /></section>
                    <section className="lg:col-span-12"><WatchlistGrid /></section>
                    <section className="lg:col-span-12"><IndicatorsPanel /></section>
                </div>
            </main>
        </div>
    );
}
