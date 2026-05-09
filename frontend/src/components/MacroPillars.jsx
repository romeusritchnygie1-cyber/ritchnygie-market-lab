import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Flame, DollarSign, AlertOctagon, ArrowRight, Shield } from "lucide-react";

const fetchPillars = () => api.get("/macro-pillars").then((r) => r.data);

const COLOR_MAP = {
    green:   { card: "card-emerald", text: "#34d399", bg: "rgba(52,211,153,0.18)", border: "rgba(52,211,153,0.55)" },
    amber:   { card: "card-amber",   text: "#fbbf24", bg: "rgba(251,191,36,0.18)", border: "rgba(251,191,36,0.55)" },
    red:     { card: "card-red",     text: "#f87171", bg: "rgba(248,113,113,0.18)", border: "rgba(248,113,113,0.55)" },
    neutral: { card: "card-navy",    text: "#94a3b8", bg: "rgba(148,163,184,0.18)", border: "rgba(148,163,184,0.55)" },
};

function PillarCard({ pillar, Icon, accentColor }) {
    if (!pillar) {
        return <div className="card-navy rounded p-5"><div className="text-base txt-mute">Loading…</div></div>;
    }
    const sig = COLOR_MAP[pillar.color] || COLOR_MAP.neutral;

    // Gauge: position the marker proportionally based on value vs threshold
    const gaugePct = (() => {
        if (pillar.label === "CPI YoY" && pillar.value != null) {
            // 0% at 1%, 100% at 5%
            return Math.max(0, Math.min(100, ((pillar.value - 1) / 4) * 100));
        }
        if (pillar.label === "DXY 5D Momentum" && pillar.value != null) {
            // -2% to +2% range
            return Math.max(0, Math.min(100, ((pillar.value + 2) / 4) * 100));
        }
        if (pillar.label === "VIX" && pillar.value != null) {
            // 10 to 40 range
            return Math.max(0, Math.min(100, ((pillar.value - 10) / 30) * 100));
        }
        return 50;
    })();

    return (
        <div className={`${sig.card} rounded p-5 transition-all`} data-testid={`pillar-${pillar.label.replace(/\s+/g, "-").toLowerCase()}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon size={18} style={{ color: accentColor }} />
                    <div className="rtl-eyebrow rtl-eyebrow-strong" style={{ color: accentColor }}>
                        {pillar.name}
                    </div>
                </div>
                {pillar.spx_warning && (
                    <span
                        className="text-[9px] tracking-[0.24em] uppercase font-headings font-bold px-2 py-0.5 rounded inline-flex items-center gap-1"
                        style={{ backgroundColor: sig.bg, color: sig.text, border: `1px solid ${sig.border}` }}
                    >
                        SPX ALERT
                    </span>
                )}
            </div>

            {/* Big value */}
            <div className="flex items-baseline gap-2 mb-2">
                <span className="font-mono font-medium text-4xl tracking-tight" style={{ color: sig.text }}>
                    {pillar.value != null ? pillar.value.toFixed(2) : "—"}
                </span>
                {pillar.unit && <span className="font-mono text-base txt-mute">{pillar.unit}</span>}
                {pillar.label === "DXY 5D Momentum" && pillar.level && (
                    <span className="font-mono text-xs txt-mute ml-2">@ {pillar.level}</span>
                )}
            </div>

            <div className="text-[11px] tracking-[0.22em] uppercase font-headings mb-3" style={{ color: sig.text }}>
                {pillar.headline}
            </div>

            {/* Gauge bar */}
            <div className="relative h-2 rounded-full overflow-hidden bg-white/5 mb-3">
                <div className="absolute inset-y-0 left-0 w-1/3" style={{ background: "linear-gradient(90deg, rgba(52,211,153,0.45), rgba(52,211,153,0.10))" }} />
                <div className="absolute inset-y-0 left-1/3 w-1/3" style={{ background: "rgba(251,191,36,0.30)" }} />
                <div className="absolute inset-y-0 right-0 w-1/3" style={{ background: "linear-gradient(90deg, rgba(248,113,113,0.10), rgba(248,113,113,0.55))" }} />
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-3.5 rounded-sm border-2 border-white shadow"
                    style={{ left: `calc(${gaugePct}% - 4px)`, backgroundColor: sig.text }}
                />
            </div>

            <p className="text-xs text-white/85 leading-relaxed flex items-start gap-1.5">
                <ArrowRight size={11} style={{ color: sig.text }} className="mt-1 shrink-0" />
                {pillar.commentary}
            </p>
        </div>
    );
}

export default function MacroPillars() {
    const [data, setData] = useState(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const r = await fetchPillars();
                if (mounted) setData(r);
            } catch (err) {
                console.error("[MacroPillars] fetch failed:", err);
            }
        };
        load();
        const id = setInterval(load, 5 * 60_000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    const compositeColor = data?.composite_color || "neutral";
    const compSig = COLOR_MAP[compositeColor] || COLOR_MAP.neutral;

    return (
        <div className="rtl-card-pro p-6" data-testid="macro-pillars">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
                <div>
                    <div className="rtl-eyebrow rtl-eyebrow-strong flex items-center gap-2">
                        <Shield size={14} className="text-violet-300" />
                        Macro Pillars · Institutional Gauges
                    </div>
                    <p className="text-sm txt-sec mt-1">
                        The 3 external forces 2026 institutions watch · CPI vs Fed target · Dollar liquidity · VIX fear
                    </p>
                </div>
                {data?.summary && (
                    <span
                        className="text-[11px] tracking-[0.26em] uppercase font-headings font-bold px-3 py-1.5 rounded"
                        style={{ backgroundColor: compSig.bg, color: compSig.text, border: `1px solid ${compSig.border}` }}
                        data-testid="pillars-composite"
                    >
                        {data.summary}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <PillarCard pillar={data?.inflation} Icon={Flame}        accentColor="#fb923c" />
                <PillarCard pillar={data?.dxy}       Icon={DollarSign}   accentColor="#c084fc" />
                <PillarCard pillar={data?.vix}       Icon={AlertOctagon} accentColor="#f87171" />
            </div>
        </div>
    );
}
