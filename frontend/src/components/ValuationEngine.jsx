import { useEffect, useState } from "react";
import api from "@/lib/api";
import { TrendingUp, TrendingDown, AlertTriangle, ArrowRight, Activity } from "lucide-react";

const fetchValuation = () => api.get("/valuation").then((r) => r.data);

const COLOR_MAP = {
    green:   { card: "card-emerald", text: "#34d399", bg: "rgba(52,211,153,0.18)", icon: TrendingUp,   border: "rgba(52,211,153,0.55)" },
    amber:   { card: "card-amber",   text: "#fbbf24", bg: "rgba(251,191,36,0.18)", icon: Activity,     border: "rgba(251,191,36,0.55)" },
    red:     { card: "card-red",     text: "#f87171", bg: "rgba(248,113,113,0.18)", icon: TrendingDown, border: "rgba(248,113,113,0.55)" },
    neutral: { card: "card-navy",    text: "#94a3b8", bg: "rgba(148,163,184,0.18)", icon: Activity,    border: "rgba(148,163,184,0.55)" },
};

const ASSET_ACCENT = {
    SPX:    { color: "#60a5fa", label: "S&P 500",  broker: "FundedNext · CFD" },
    GOLD:   { color: "#fbbf24", label: "Gold",     broker: "FTMO · OANDA" },
    SILVER: { color: "#67e8f9", label: "Silver",   broker: "FTMO · OANDA" },
};

function ValuationTile({ data, accent }) {
    const sig = COLOR_MAP[data?.color] || COLOR_MAP.neutral;
    const Icon = sig.icon;

    if (!data || data.error) {
        return (
            <div className="card-navy rounded p-5">
                <div className="rtl-eyebrow rtl-eyebrow-strong" style={{ color: accent.color }}>
                    {accent.label}
                </div>
                <div className="text-base txt-mute mt-3">Loading valuation…</div>
            </div>
        );
    }

    const trailing = data.trailing_metric;
    const forward = data.forward_metric;
    const delta = trailing && forward ? forward - trailing : 0;
    const deltaPct = trailing ? (delta / trailing) * 100 : 0;

    return (
        <div className={`${sig.card} rounded p-5 transition-all`} data-testid={`valuation-tile-${data.symbol}`}>
            {/* header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="rtl-eyebrow rtl-eyebrow-strong" style={{ color: accent.color }}>
                        {accent.label}
                    </div>
                    <div className="text-[10px] tracking-[0.22em] uppercase font-headings txt-mute mt-1">
                        {accent.broker} · {data.metric_type}
                    </div>
                </div>
                <span
                    className="text-[10px] tracking-[0.28em] uppercase font-headings font-bold px-2.5 py-1 rounded inline-flex items-center gap-1.5"
                    style={{ backgroundColor: sig.bg, color: sig.text, border: `1px solid ${sig.border}` }}
                    data-testid={`valuation-signal-${data.symbol}`}
                >
                    <Icon size={11} /> {data.signal}
                </span>
            </div>

            {/* values */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <div className="rtl-eyebrow mb-1">{data.trailing_label}</div>
                    <div className="font-mono font-medium text-3xl tracking-tight" style={{ color: accent.color }}>
                        {trailing != null ? trailing.toFixed(2) : "—"}
                    </div>
                </div>
                <div>
                    <div className="rtl-eyebrow mb-1">{data.forward_label}</div>
                    <div className="font-mono font-medium text-3xl tracking-tight" style={{ color: sig.text }}>
                        {forward != null ? forward.toFixed(2) : "—"}
                    </div>
                </div>
            </div>

            {/* delta arrow */}
            {trailing != null && forward != null && (
                <div className="flex items-center gap-2 mb-3 text-xs font-mono">
                    <span className="txt-mute">Δ</span>
                    <span style={{ color: sig.text }} className="font-medium">
                        {delta >= 0 ? "+" : ""}{delta.toFixed(2)} ({deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(1)}%)
                    </span>
                </div>
            )}

            {/* commentary */}
            <div className="pt-3 border-t border-white/10 flex items-start gap-2">
                <ArrowRight size={12} style={{ color: sig.text }} className="mt-0.5 shrink-0" />
                <p className="text-xs text-white/85 leading-relaxed">{data.commentary}</p>
            </div>
        </div>
    );
}

export default function ValuationEngine() {
    const [data, setData] = useState(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const v = await fetchValuation();
                if (mounted) setData(v);
            } catch (err) {
                console.error("[ValuationEngine] fetch failed:", err);
            }
        };
        load();
        const id = setInterval(load, 5 * 60_000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    return (
        <div className="rtl-card-pro p-6" data-testid="valuation-engine">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
                <div>
                    <div className="rtl-eyebrow rtl-eyebrow-strong flex items-center gap-2">
                        <AlertTriangle size={14} className="text-violet-300" />
                        Valuation Engine · Expectation Gap
                    </div>
                    <p className="text-sm txt-sec mt-1">
                        Trailing vs Forward earnings expectations across all 3 markets · live·daily
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 text-[10px] tracking-[0.20em] uppercase font-headings">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: "rgba(52,211,153,0.15)", color: "#34d399" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: "#34d399" }} /> Growth Bet
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: "#fbbf24" }} /> Neutral
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#f87171" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: "#f87171" }} /> Caution
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <ValuationTile data={data?.spx}    accent={ASSET_ACCENT.SPX} />
                <ValuationTile data={data?.silver} accent={ASSET_ACCENT.SILVER} />
                <ValuationTile data={data?.gold}   accent={ASSET_ACCENT.GOLD} />
            </div>

            {/* SPX components drilldown */}
            {data?.spx?.components?.length > 0 && (
                <details className="mt-4 group" data-testid="valuation-components">
                    <summary className="text-[11px] tracking-[0.22em] uppercase font-headings txt-mute cursor-pointer hover:text-white transition-colors">
                        SPX top-10 component breakdown ›
                    </summary>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
                        {data.spx.components.map((c) => (
                            <div key={c.symbol} className="rtl-bg-card rounded px-3 py-2 border border-white/5">
                                <div className="text-[10px] tracking-[0.18em] uppercase font-headings txt-mute">{c.symbol}</div>
                                <div className="font-mono text-xs text-white/85 mt-1">
                                    {c.trailing_pe} → <span className="text-blue-300">{c.forward_pe}</span>
                                </div>
                                <div className="text-[9px] txt-mute font-mono mt-0.5">{c.weight_pct}% wt</div>
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}
