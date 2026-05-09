import { useEffect, useState } from "react";
import api from "@/lib/api";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ArrowRight, Target } from "lucide-react";

const MARKETS = [
    { sym: "SPX",    label: "S&P 500",  color: "#60a5fa", text: "text-blue-300",   tint: "card-navy",  broker: "FundedNext · CFD" },
    { sym: "SILVER", label: "Silver",   color: "#67e8f9", text: "text-cyan-300",   tint: "card-cyan",  broker: "FTMO · OANDA" },
    { sym: "GOLD",   label: "Gold",     color: "#fbbf24", text: "text-amber-300",  tint: "card-amber", broker: "FTMO · OANDA" },
];

const fetchEngine = (sym) => api.get(`/market-engine/${sym}`).then((r) => r.data);

export default function MarketEngine() {
    const [data, setData] = useState({});
    const [active, setActive] = useState("SPX");

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            for (const { sym } of MARKETS) {
                try {
                    const d = await fetchEngine(sym);
                    if (mounted) setData((prev) => ({ ...prev, [sym]: d }));
                } catch (err) {
                    console.error("[MarketEngine]", sym, err);
                }
            }
        };
        load();
        const id = setInterval(load, 5 * 60_000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    const cur = data[active];
    const meta = MARKETS.find((m) => m.sym === active);

    return (
        <div className={`${meta.tint} rounded p-6 transition-colors`} data-testid="market-engine">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <div className="rtl-eyebrow rtl-eyebrow-strong flex items-center gap-2" style={{ color: meta.color }}>
                        <Target size={14} /> Dynamic Market Analysis Engine
                    </div>
                    <p className="text-sm txt-sec mt-1">
                        Live S/R · liquidity · regime · breakout & continuation probabilities · <span style={{ color: meta.color }}>{meta.broker}</span>
                    </p>
                </div>
                <div className="flex gap-2" data-testid="engine-tabs">
                    {MARKETS.map((m) => {
                        const isOn = active === m.sym;
                        return (
                            <button
                                key={m.sym}
                                onClick={() => setActive(m.sym)}
                                data-testid={`engine-tab-${m.sym}`}
                                className="text-xs tracking-[0.22em] uppercase font-headings px-3 py-2 rounded transition-all border"
                                style={
                                    isOn
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

            {!cur ? (
                <div className="text-center py-10 txt-mute text-base">Analyzing {meta.label}…</div>
            ) : cur.error ? (
                <div className="text-center py-10 txt-warn text-base">Insufficient data for {meta.label}.</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Regime + bias panel */}
                    <div className="lg:col-span-4 space-y-3">
                        <RegimeBanner regime={cur.regime} narrative={cur.narrative} />
                        <ProbCard label="Breakout Probability"    value={cur.probabilities.breakout}    bias={cur.regime.bias} />
                        <ProbCard label="Continuation Probability" value={cur.probabilities.continuation} bias={cur.regime.bias} />
                    </div>

                    {/* Levels */}
                    <div className="lg:col-span-5">
                        <Levels cur={cur} />
                    </div>

                    {/* Indicators + correlations */}
                    <div className="lg:col-span-3 space-y-3">
                        <IndicatorBlock ind={cur.indicators} />
                        <CorrelationBlock corr={cur.macro_correlations} />
                    </div>

                    {/* Reversal warnings full-width */}
                    {cur.reversal_warnings?.length > 0 && (
                        <div className="lg:col-span-12">
                            <div className="card-red rounded p-3">
                                <div className="rtl-eyebrow flex items-center gap-2 mb-2 txt-down">
                                    <AlertTriangle size={12} /> Reversal Warnings
                                </div>
                                <ul className="space-y-1">
                                    {cur.reversal_warnings.map((w) => (
                                        <li key={w} className="text-sm text-white/85 flex items-start gap-2">
                                            <ArrowRight size={12} className="txt-down mt-1 shrink-0" />
                                            <span>{w}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function RegimeBanner({ regime, narrative }) {
    const Icon =
        regime.bias === "bullish" ? TrendingUp :
        regime.bias === "bearish" ? TrendingDown : Minus;
    const cardClass =
        regime.bias === "bullish" ? "card-blue" :
        regime.bias === "bearish" ? "card-red" : "card-amber";
    const textColor =
        regime.bias === "bullish" ? "#60a5fa" :
        regime.bias === "bearish" ? "#f87171" : "#fbbf24";
    return (
        <div className={`${cardClass} rounded p-4`} data-testid="regime-banner">
            <div className="flex items-center gap-2 mb-2">
                <Icon size={14} style={{ color: textColor }} />
                <span className="text-xs tracking-[0.22em] uppercase font-headings font-bold" style={{ color: textColor }}>
                    {regime.label}
                </span>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">{narrative}</p>
        </div>
    );
}

function ProbCard({ label, value, bias }) {
    const tone =
        value >= 65 ? (bias === "bearish" ? "card-red" : "card-blue") :
        value <= 35 ? "card-amber" : "card-purple";
    const color =
        value >= 65 ? (bias === "bearish" ? "#f87171" : "#60a5fa") :
        value <= 35 ? "#fbbf24" : "#c084fc";
    return (
        <div className={`${tone} rounded p-3`}>
            <div className="rtl-eyebrow mb-1.5">{label}</div>
            <div className="flex items-baseline gap-2">
                <div className="font-mono text-2xl" style={{ color }}>{value}%</div>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
                </div>
            </div>
        </div>
    );
}

function Levels({ cur }) {
    return (
        <div className="border border-rtl-soft rounded p-4 space-y-3" data-testid="engine-levels">
            <div className="rtl-eyebrow rtl-eyebrow-strong">Actionable Levels</div>

            <LevelRow label="Buy Above"       value={cur.levels.buy_above}  color="#60a5fa" tone="up"   subtitle="Long trigger + ATR slip" />
            <LevelRow label="Current Price"   value={cur.close}              color="#ffffff" tone="hi"   subtitle={`SMA20 ${cur.sma20}  ·  SMA50 ${cur.sma50}`} />
            <LevelRow label="Sell Below"      value={cur.levels.sell_below} color="#f87171" tone="down" subtitle="Short trigger + ATR slip" />

            {cur.no_trade_zone && (
                <div className="card-amber rounded p-3">
                    <div className="rtl-eyebrow txt-warn flex items-center gap-2 mb-1">
                        <AlertTriangle size={11} /> No-Trade Zone
                    </div>
                    <div className="font-mono text-sm text-white">
                        {cur.no_trade_zone.low} – {cur.no_trade_zone.high}
                    </div>
                    <div className="text-xs txt-sec mt-1">{cur.no_trade_zone.reason}</div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rtl-soft">
                <ZoneList title="Resistance" zones={cur.resistance_zones} color="#f87171" />
                <ZoneList title="Support"    zones={cur.support_zones}    color="#60a5fa" />
            </div>
        </div>
    );
}

function LevelRow({ label, value, color, tone, subtitle }) {
    const cls = tone === "up" ? "card-blue" : tone === "down" ? "card-red" : "border border-rtl-soft";
    return (
        <div className={`${cls} rounded p-3 flex items-center justify-between gap-3`}>
            <div>
                <div className="rtl-eyebrow mb-0.5">{label}</div>
                <div className="text-xs txt-sec">{subtitle}</div>
            </div>
            <div className="font-mono font-medium text-2xl" style={{ color }}>
                {Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </div>
        </div>
    );
}

function ZoneList({ title, zones, color }) {
    return (
        <div>
            <div className="rtl-eyebrow mb-1.5" style={{ color }}>{title}</div>
            <div className="space-y-1">
                {(zones || []).slice(-4).reverse().map((z) => (
                    <div key={`${z.mid}-${z.touches}`} className="flex items-center justify-between text-xs">
                        <span className="font-mono text-white">{z.mid}</span>
                        <span className="text-[10px] tracking-wider uppercase txt-mute">
                            {z.touches}× {z.strength}
                        </span>
                    </div>
                ))}
                {(!zones || zones.length === 0) && (
                    <div className="text-xs txt-mute">No zones</div>
                )}
            </div>
        </div>
    );
}

function IndicatorBlock({ ind }) {
    return (
        <div className="border border-rtl-soft rounded p-3 space-y-2" data-testid="engine-indicators">
            <div className="rtl-eyebrow">Indicators</div>
            <Row label="ADX" value={ind.adx}     suffix="" colorize={ind.adx >= 25 ? "txt-warn" : "txt-mute"} />
            <Row label="RSI" value={ind.rsi}     suffix="" colorize={ind.rsi >= 70 ? "txt-down" : ind.rsi <= 30 ? "txt-up" : "text-white"} />
            <Row label="ATR%" value={ind.atr_pct} suffix="%" colorize="txt-down" />
            {ind.vix !== null && ind.vix !== undefined && (
                <Row label="VIX" value={ind.vix} suffix="" colorize={ind.vix >= 22 ? "txt-down" : "text-white"} />
            )}
        </div>
    );
}

function CorrelationBlock({ corr }) {
    return (
        <div className="border border-rtl-soft rounded p-3 space-y-2" data-testid="engine-correlations">
            <div className="rtl-eyebrow">30D Correlation</div>
            {[
                { k: "vs_spx", l: "vs SPX" },
                { k: "vs_dxy", l: "vs DXY" },
                { k: "vs_10y", l: "vs 10Y" },
            ].map(({ k, l }) => {
                const v = corr[k];
                if (v === null || v === undefined) return <Row key={k} label={l} value="—" />;
                const cls = v >= 0.3 ? "txt-up" : v <= -0.3 ? "txt-down" : "text-white";
                return <Row key={k} label={l} value={v.toFixed(2)} colorize={cls} />;
            })}
        </div>
    );
}

function Row({ label, value, suffix = "", colorize = "text-white" }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="rtl-eyebrow">{label}</span>
            <span className={`font-mono ${colorize}`}>{value}{suffix}</span>
        </div>
    );
}
