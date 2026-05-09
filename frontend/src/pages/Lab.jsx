import { useEffect, useState } from "react";
import { useRef } from "react";
import Header from "@/components/Header";
import TickerStrip from "@/components/TickerStrip";
import api, { runBacktest } from "@/lib/api";
import { createChart, AreaSeries } from "lightweight-charts";
import { Play } from "lucide-react";

const SYMBOLS = ["SPX", "GOLD", "SILVER", "DXY", "VIX", "AAPL", "MSFT", "NVDA", "TSLA"];
const STRATEGIES = [
    { v: "regime_breakout", label: "Regime Breakout (ADX + 20D high)" },
    { v: "mean_reversion",  label: "Mean Reversion (RSI extreme)" },
];
const PERIODS = ["1y", "2y", "5y"];

const MARKET_FILTERS = [
    { key: null,       label: "All Markets",  color: "#a1a1aa" },
    { key: "SPX",      label: "S&P 500",       color: "#60a5fa" },
    { key: "SILVER",   label: "Silver",        color: "#67e8f9" },
    { key: "GOLD",     label: "Gold",          color: "#fbbf24" },
];

const fetchBehaviorFiltered = (symbol) =>
    api.get("/journal/behavior", { params: symbol ? { symbol } : {} }).then((r) => r.data);
const fetchProbabilityFiltered = (symbol) =>
    api.get("/journal/probability", { params: symbol ? { symbol } : {} }).then((r) => r.data);

export default function Lab() {
    const [filter, setFilter] = useState(MARKET_FILTERS[0]);
    const [behavior, setBehavior] = useState(null);
    const [prob, setProb] = useState(null);

    // Backtest params
    const [symbol, setSymbol] = useState("SPX");
    const [strategy, setStrategy] = useState("regime_breakout");
    const [period, setPeriod] = useState("2y");
    const [adx, setAdx] = useState(25);
    const [rsiBuy, setRsiBuy] = useState(30);
    const [rsiSell, setRsiSell] = useState(60);
    const [bt, setBt] = useState(null);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        (async () => {
            try { setBehavior(await fetchBehaviorFiltered(filter.key)); }
            catch (err) { console.error("[Lab] behavior fetch failed:", err); }
            try { setProb(await fetchProbabilityFiltered(filter.key)); }
            catch (err) { console.error("[Lab] probability fetch failed:", err); }
        })();
    }, [filter]);

    const run = async () => {
        try {
            setRunning(true);
            const data = await runBacktest({ symbol, strategy, period, adx_threshold: adx, rsi_buy: rsiBuy, rsi_sell: rsiSell });
            setBt(data);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="min-h-screen rtl-bg-base" data-testid="lab-page">
            <Header />
            <TickerStrip />

            <main className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-8">
                <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
                    <div>
                        <div className="rtl-eyebrow rtl-eyebrow-strong">Quant Lab</div>
                        <h1 className="font-headings font-bold text-3xl md:text-4xl tracking-tight mt-2">
                            Backtester · Probability · Behavior
                        </h1>
                        <p className="text-base txt-sec mt-2">Real stats computed from your trade journal — filter by market.</p>
                    </div>
                    <div className="flex flex-wrap gap-2" data-testid="market-filter">
                        {MARKET_FILTERS.map((m) => {
                            const active = filter.key === m.key;
                            return (
                                <button
                                    key={m.label}
                                    onClick={() => setFilter(m)}
                                    data-testid={`filter-${m.key || "all"}`}
                                    className="text-xs tracking-[0.22em] uppercase font-headings px-3 py-2 rounded transition-all border"
                                    style={
                                        active
                                            ? { borderColor: m.color + "80", backgroundColor: m.color + "20", color: m.color }
                                            : { borderColor: "transparent", color: "var(--rtl-text-muted)" }
                                    }
                                >
                                    {m.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Behavior Stats */}
                <section className="rtl-card-pro p-6 mb-3" data-testid="behavior-section">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <div className="rtl-eyebrow rtl-eyebrow-strong">Behavior Stats</div>
                            <p className="text-sm txt-sec mt-1">
                                {filter.key ? `Filtered to ${filter.label}` : "All markets"} · live from journal
                            </p>
                        </div>
                    </div>

                    {!behavior || behavior.total === 0 ? (
                        <div className="text-center py-8 txt-mute text-base">
                            No trades yet for {filter.label.toLowerCase()}. Add trades in the <span className="text-white">Journal</span> tab.
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                                <Stat label="Trades" value={behavior.total} color="card-blue" text="#60a5fa" />
                                <Stat label="Winrate" value={`${behavior.winrate}%`} color={behavior.winrate >= 50 ? "card-emerald" : "card-red"} text={behavior.winrate >= 50 ? "#34d399" : "#f87171"} />
                                <Stat label="Expectancy" value={behavior.expectancy?.toFixed(3) || "0"} color="card-amber" text="#fbbf24" />
                                <Stat label="Avg Win R" value={behavior.avg_win_r?.toFixed(2) + "R"} color="card-blue" text="#60a5fa" />
                                <Stat label="Avg Loss R" value={behavior.avg_loss_r?.toFixed(2) + "R"} color="card-red" text="#f87171" />
                            </div>

                            {(behavior.avg_adx_winners > 0 || behavior.avg_atr_winners > 0) && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                                    <Stat label="Avg ADX (wins)"   value={behavior.avg_adx_winners.toFixed(1)} color="card-orange" text="#fb923c" />
                                    <Stat label="Avg ADX (losses)" value={behavior.avg_adx_losers.toFixed(1)}  color="card-purple" text="#c084fc" />
                                    <Stat label="Avg ATR (wins)"   value={behavior.avg_atr_winners.toFixed(3)} color="card-orange" text="#fb923c" />
                                    <Stat label="Avg ATR (losses)" value={behavior.avg_atr_losers.toFixed(3)}  color="card-purple" text="#c084fc" />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <BreakdownTable title="By Session" rows={behavior.by_session} />
                                <BreakdownTable title="By Day"     rows={behavior.by_day} />
                                <BreakdownTable title="By Symbol"  rows={behavior.by_symbol} />
                                <BreakdownTable title="By Setup"   rows={behavior.by_setup} />
                            </div>
                        </>
                    )}
                </section>

                {/* Probability Engine */}
                <section className="rtl-card-pro p-6 mb-3" data-testid="probability-section">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <div className="rtl-eyebrow rtl-eyebrow-strong">Probability Engine</div>
                            <p className="text-sm txt-sec mt-1">Edge-score across setups, contexts, ADX & ATR regimes</p>
                        </div>
                    </div>

                    {!prob || (prob.setups?.length === 0 && prob.context?.length === 0) ? (
                        <div className="text-center py-8 txt-mute text-base">
                            Probability edge unlocks once you've logged a few trades.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <ProbabilityTable title="Top Setup × Side Edges" rows={prob.setups} cols={["setup", "side"]} />
                            <ProbabilityTable title="Day × Session × Symbol Edges" rows={prob.context} cols={["day", "session", "symbol"]} />
                            {prob.adx_buckets?.length > 0 && (
                                <ProbabilityTable title="ADX Regime Edge" rows={prob.adx_buckets} cols={["bucket"]} />
                            )}
                            {prob.atr_buckets?.length > 0 && (
                                <ProbabilityTable title="ATR Volatility Edge" rows={prob.atr_buckets} cols={["bucket"]} />
                            )}
                        </div>
                    )}
                </section>

                {/* Backtester */}
                <section className="rtl-card-pro p-6" data-testid="backtest-section">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <div className="rtl-eyebrow rtl-eyebrow-strong">Strategy Backtester</div>
                            <p className="text-sm txt-sec mt-1">Run macro strategies on real OHLC history</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
                        <FieldSelect label="Symbol" value={symbol} onChange={setSymbol} options={SYMBOLS} />
                        <FieldSelect label="Strategy" value={strategy} onChange={setStrategy} options={STRATEGIES.map((s) => ({ v: s.v, label: s.label }))} />
                        <FieldSelect label="Period" value={period} onChange={setPeriod} options={PERIODS} />
                        {strategy === "regime_breakout" ? (
                            <FieldNumber label="ADX Threshold" value={adx} onChange={setAdx} />
                        ) : (
                            <>
                                <FieldNumber label="RSI Buy" value={rsiBuy} onChange={setRsiBuy} />
                                <FieldNumber label="RSI Sell" value={rsiSell} onChange={setRsiSell} />
                            </>
                        )}
                        <button
                            onClick={run}
                            disabled={running}
                            data-testid="run-backtest"
                            className="flex items-center justify-center gap-2 bg-blue-500 text-black hover:bg-blue-400 transition-colors text-xs tracking-[0.22em] uppercase font-headings disabled:opacity-50 px-4"
                        >
                            <Play size={12} fill="currentColor" /> {running ? "Running…" : "Run"}
                        </button>
                    </div>

                    {bt && bt.summary && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                                <Stat label="Initial" value={`$${bt.summary.initial}`} />
                                <Stat label="Final"   value={`$${bt.summary.final}`} color={bt.summary.final >= bt.summary.initial ? "card-emerald" : "card-red"} text={bt.summary.final >= bt.summary.initial ? "#34d399" : "#f87171"} />
                                <Stat label="Return"  value={`${bt.summary.return_pct}%`} color={bt.summary.return_pct >= 0 ? "card-emerald" : "card-red"} text={bt.summary.return_pct >= 0 ? "#34d399" : "#f87171"} />
                                <Stat label="Max DD"  value={`${bt.summary.max_dd_pct}%`} color="card-red" text="#f87171" />
                                <Stat label="Trades · Winrate" value={`${bt.summary.trades} · ${bt.summary.winrate}%`} />
                            </div>
                            <EquityCurve data={bt.equity_curve} />
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}

function Stat({ label, value, color = "", text = "" }) {
    if (color) {
        return (
            <div className={`${color} rounded p-3`}>
                <div className="rtl-eyebrow">{label}</div>
                <div className="font-mono text-xl mt-1.5" style={{ color: text || "white" }}>{value}</div>
            </div>
        );
    }
    return (
        <div className="border border-rtl-soft p-3 rounded">
            <div className="rtl-eyebrow">{label}</div>
            <div className="font-mono text-xl mt-1.5 text-white">{value}</div>
        </div>
    );
}

function BreakdownTable({ title, rows }) {
    return (
        <div className="border border-rtl-soft rounded">
            <div className="rtl-eyebrow px-3 py-2 border-b border-rtl-soft">{title}</div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-[10px] tracking-[0.18em] uppercase txt-mute font-headings border-b border-rtl-soft">
                        <th className="text-left px-3 py-1.5">Key</th>
                        <th className="text-right px-3 py-1.5">N</th>
                        <th className="text-right px-3 py-1.5">Win%</th>
                        <th className="text-right px-3 py-1.5">PnL</th>
                    </tr>
                </thead>
                <tbody>
                    {(rows || []).map((r) => (
                        <tr key={`${r.key}-${r.trades}`} className="border-b border-rtl-soft">
                            <td className="px-3 py-1.5 text-white">{r.key}</td>
                            <td className="px-3 py-1.5 font-mono text-right txt-sec">{r.trades}</td>
                            <td className={`px-3 py-1.5 font-mono text-right ${r.winrate >= 50 ? "txt-up" : "txt-down"}`}>{r.winrate}%</td>
                            <td className={`px-3 py-1.5 font-mono text-right ${r.total_pnl >= 0 ? "txt-up" : "txt-down"}`}>{r.total_pnl}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ProbabilityTable({ title, rows, cols }) {
    return (
        <div className="border border-rtl-soft rounded">
            <div className="rtl-eyebrow px-3 py-2 border-b border-rtl-soft">{title}</div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[10px] tracking-[0.18em] uppercase txt-mute font-headings border-b border-rtl-soft">
                            {cols.map((c) => <th key={c} className="text-left px-3 py-1.5">{c}</th>)}
                            <th className="text-right px-3 py-1.5">N</th>
                            <th className="text-right px-3 py-1.5">Win%</th>
                            <th className="text-right px-3 py-1.5">Avg R</th>
                            <th className="text-right px-3 py-1.5">Edge</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(rows || []).slice(0, 12).map((r, i) => {
                            const stableKey = cols.map((c) => r[c]).join("|") + `:${i}`;
                            return (
                            <tr key={stableKey} className="border-b border-rtl-soft">
                                {cols.map((c) => <td key={c} className="px-3 py-1.5 text-white">{r[c]}</td>)}
                                <td className="px-3 py-1.5 font-mono text-right txt-sec">{r.trades}</td>
                                <td className={`px-3 py-1.5 font-mono text-right ${r.winrate >= 50 ? "txt-up" : "txt-down"}`}>{r.winrate}%</td>
                                <td className={`px-3 py-1.5 font-mono text-right ${r.avg_r >= 0 ? "txt-up" : "txt-down"}`}>{r.avg_r}R</td>
                                <td className="px-3 py-1.5 font-mono text-right text-white">{r.edge_score}</td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function EquityCurve({ data }) {
    const ref = useRef(null);
    useEffect(() => {
        if (!ref.current || !data?.length) return;
        const chart = createChart(ref.current, {
            autoSize: true,
            localization: { locale: "en-US" },
            layout: { background: { color: "transparent" }, textColor: "#a1a1aa", fontFamily: "JetBrains Mono", fontSize: 11 },
            grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
            rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
            timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true },
        });
        const series = chart.addSeries(AreaSeries, {
            lineColor: "#3b82f6",
            topColor: "rgba(59,130,246,0.3)",
            bottomColor: "rgba(59,130,246,0.0)",
            lineWidth: 2,
        });
        series.setData(data);
        chart.timeScale().fitContent();
        return () => chart.remove();
    }, [data]);
    return <div ref={ref} style={{ width: "100%", height: 320 }} className="border border-rtl-soft rounded" data-testid="equity-curve" />;
}

function FieldSelect({ label, value, onChange, options }) {
    const isObj = typeof options[0] === "object";
    return (
        <div>
            <div className="rtl-eyebrow mb-1.5">{label}</div>
            <select className="rtl-input" value={value} onChange={(e) => onChange(e.target.value)}>
                {options.map((o) => isObj ? <option key={o.v} value={o.v}>{o.label}</option> : <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

function FieldNumber({ label, value, onChange }) {
    return (
        <div>
            <div className="rtl-eyebrow mb-1.5">{label}</div>
            <input type="number" step="any" className="rtl-input font-mono" value={value} onChange={(e) => onChange(Number(e.target.value))} />
        </div>
    );
}
