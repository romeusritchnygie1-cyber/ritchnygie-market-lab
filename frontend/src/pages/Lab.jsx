import { useEffect, useState } from "react";
import { useRef } from "react";
import Header from "@/components/Header";
import TickerStrip from "@/components/TickerStrip";
import { fetchBehavior, fetchProbability, runBacktest } from "@/lib/api";
import { createChart, AreaSeries } from "lightweight-charts";
import { Play } from "lucide-react";

const SYMBOLS = ["SPX", "GOLD", "SILVER", "DXY", "VIX", "AAPL", "MSFT", "NVDA", "TSLA"];
const STRATEGIES = [
    { v: "regime_breakout", label: "Regime Breakout (ADX + 20D high)" },
    { v: "mean_reversion",  label: "Mean Reversion (RSI extreme)" },
];
const PERIODS = ["1y", "2y", "5y"];

export default function Lab() {
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
            try { setBehavior(await fetchBehavior()); } catch { /* ignore */ }
            try { setProb(await fetchProbability()); } catch { /* ignore */ }
        })();
    }, []);

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

            <main className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-6">
                <div className="mb-6">
                    <div className="rtl-eyebrow">Quant Lab</div>
                    <h1 className="font-headings font-bold text-3xl md:text-4xl tracking-tight mt-1">
                        Backtester · Probability · Behavior
                    </h1>
                </div>

                {/* Behavior Stats */}
                <section className="rtl-card-pro p-5 mb-3" data-testid="behavior-section">
                    <div className="flex items-center justify-between mb-4">
                        <div className="rtl-eyebrow rtl-eyebrow-strong">Behavior Stats</div>
                        <span className="text-[10px] tracking-[0.18em] uppercase txt-mute font-headings">
                            Computed from your journal
                        </span>
                    </div>

                    {!behavior || behavior.total === 0 ? (
                        <div className="text-center py-8 txt-mute text-sm">
                            Add trades in the <span className="text-white">Journal</span> to see your stats here.
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                                <Stat label="Trades" value={behavior.total} />
                                <Stat label="Winrate" value={`${behavior.winrate}%`} accent={behavior.winrate >= 50 ? "up" : "down"} />
                                <Stat label="Expectancy" value={behavior.expectancy?.toFixed(3) || "0"} accent={behavior.expectancy >= 0 ? "up" : "down"} />
                                <Stat label="Avg Win R" value={behavior.avg_win_r?.toFixed(2) + "R"} accent="up" />
                                <Stat label="Avg Loss R" value={behavior.avg_loss_r?.toFixed(2) + "R"} accent="down" />
                            </div>

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
                <section className="rtl-card-pro p-5 mb-3" data-testid="probability-section">
                    <div className="flex items-center justify-between mb-4">
                        <div className="rtl-eyebrow rtl-eyebrow-strong">Probability Engine</div>
                        <span className="text-[10px] tracking-[0.18em] uppercase txt-mute font-headings">
                            Edge by setup × context
                        </span>
                    </div>

                    {!prob || (prob.setups?.length === 0 && prob.context?.length === 0) ? (
                        <div className="text-center py-8 txt-mute text-sm">
                            Probability edge unlocks once you've logged a few trades.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <ProbabilityTable title="Top Setup × Side Edges" rows={prob.setups} cols={["setup", "side"]} />
                            <ProbabilityTable title="Day × Session × Symbol Edges" rows={prob.context} cols={["day", "session", "symbol"]} />
                        </div>
                    )}
                </section>

                {/* Backtester */}
                <section className="rtl-card-pro p-5" data-testid="backtest-section">
                    <div className="flex items-center justify-between mb-4">
                        <div className="rtl-eyebrow rtl-eyebrow-strong">Strategy Backtester</div>
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
                            className="flex items-center justify-center gap-2 bg-blue-500 text-black hover:bg-blue-400 transition-colors text-[11px] tracking-[0.22em] uppercase font-headings disabled:opacity-50 px-4"
                        >
                            <Play size={12} fill="currentColor" /> {running ? "Running…" : "Run"}
                        </button>
                    </div>

                    {bt && bt.summary && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                                <Stat label="Initial" value={`$${bt.summary.initial}`} />
                                <Stat label="Final"   value={`$${bt.summary.final}`} accent={bt.summary.final >= bt.summary.initial ? "up" : "down"} />
                                <Stat label="Return"  value={`${bt.summary.return_pct}%`} accent={bt.summary.return_pct >= 0 ? "up" : "down"} />
                                <Stat label="Max DD"  value={`${bt.summary.max_dd_pct}%`} accent="down" />
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

function Stat({ label, value, accent }) {
    const cls = accent === "up" ? "txt-up" : accent === "down" ? "txt-down" : "text-white";
    return (
        <div className="border border-white/[0.06] p-3 rounded-sm">
            <div className="rtl-eyebrow">{label}</div>
            <div className={`font-mono text-xl mt-1.5 ${cls}`}>{value}</div>
        </div>
    );
}

function BreakdownTable({ title, rows }) {
    return (
        <div className="border border-white/[0.06] rounded-sm">
            <div className="rtl-eyebrow px-3 py-2 border-b border-white/[0.06]">{title}</div>
            <table className="w-full text-xs">
                <thead>
                    <tr className="text-[9px] tracking-[0.18em] uppercase txt-mute font-headings border-b border-white/[0.06]">
                        <th className="text-left px-3 py-1.5">Key</th>
                        <th className="text-right px-3 py-1.5">N</th>
                        <th className="text-right px-3 py-1.5">Win%</th>
                        <th className="text-right px-3 py-1.5">PnL</th>
                    </tr>
                </thead>
                <tbody>
                    {(rows || []).map((r, i) => (
                        <tr key={i} className="border-b border-white/[0.03]">
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
        <div className="border border-white/[0.06] rounded-sm">
            <div className="rtl-eyebrow px-3 py-2 border-b border-white/[0.06]">{title}</div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="text-[9px] tracking-[0.18em] uppercase txt-mute font-headings border-b border-white/[0.06]">
                            {cols.map((c) => <th key={c} className="text-left px-3 py-1.5">{c}</th>)}
                            <th className="text-right px-3 py-1.5">N</th>
                            <th className="text-right px-3 py-1.5">Win%</th>
                            <th className="text-right px-3 py-1.5">Avg R</th>
                            <th className="text-right px-3 py-1.5">Edge</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(rows || []).slice(0, 12).map((r, i) => (
                            <tr key={i} className="border-b border-white/[0.03]">
                                {cols.map((c) => <td key={c} className="px-3 py-1.5 text-white">{r[c]}</td>)}
                                <td className="px-3 py-1.5 font-mono text-right txt-sec">{r.trades}</td>
                                <td className={`px-3 py-1.5 font-mono text-right ${r.winrate >= 50 ? "txt-up" : "txt-down"}`}>{r.winrate}%</td>
                                <td className={`px-3 py-1.5 font-mono text-right ${r.avg_r >= 0 ? "txt-up" : "txt-down"}`}>{r.avg_r}R</td>
                                <td className="px-3 py-1.5 font-mono text-right text-white">{r.edge_score}</td>
                            </tr>
                        ))}
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
            layout: { background: { color: "#000" }, textColor: "#a1a1aa", fontFamily: "JetBrains Mono", fontSize: 11 },
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
    return <div ref={ref} style={{ width: "100%", height: 320 }} className="border border-white/[0.06]" data-testid="equity-curve" />;
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
