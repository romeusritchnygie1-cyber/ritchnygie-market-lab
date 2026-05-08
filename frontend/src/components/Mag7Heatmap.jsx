import { usePolling } from "@/lib/usePolling";
import { fetchMag7 } from "@/lib/api";

// Each Mag7 ticker gets a signature color identity
const TICKER_COLOR = {
    AAPL:  { card: "card-blue",    chip: "rgba(59,130,246,0.30)",   text: "#60a5fa" },
    MSFT:  { card: "card-cyan",    chip: "rgba(6,182,212,0.30)",    text: "#22d3ee" },
    GOOGL: { card: "card-emerald", chip: "rgba(16,185,129,0.30)",   text: "#34d399" },
    AMZN:  { card: "card-amber",   chip: "rgba(251,191,36,0.30)",   text: "#fbbf24" },
    META:  { card: "card-purple",  chip: "rgba(168,85,247,0.30)",   text: "#c084fc" },
    NVDA:  { card: "card-orange",  chip: "rgba(249,115,22,0.35)",   text: "#fb923c" },
    TSLA:  { card: "card-red",     chip: "rgba(239,68,68,0.30)",    text: "#f87171" },
};

export default function Mag7Heatmap() {
    const { data, loading } = usePolling(fetchMag7, 30000, []);
    const items = data?.mag7 || [];

    return (
        <div className="rtl-card-pro p-6" data-testid="mag7-heatmap">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <div className="rtl-eyebrow rtl-eyebrow-strong">Magnificent 7</div>
                    <p className="text-sm txt-sec mt-1">Big Tech leadership pulse</p>
                </div>
                <div className="text-xs tracking-[0.18em] uppercase txt-mute font-headings">
                    24h % change
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-md bg-white/[0.03] animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {items.map((t) => <Tile key={t.symbol} t={t} />)}
                </div>
            )}
        </div>
    );
}

function Tile({ t }) {
    const pct = t.change_pct ?? 0;
    const up = pct >= 0;
    const c = TICKER_COLOR[t.symbol] || TICKER_COLOR.AAPL;

    return (
        <div className={`${c.card} rounded p-4 transition-transform hover:-translate-y-0.5`} data-testid={`mag7-${t.symbol}`}>
            <div className="flex items-baseline justify-between mb-3">
                <div className="font-headings font-bold text-xl tracking-tight" style={{ color: c.text }}>
                    {t.symbol}
                </div>
                <span
                    className="text-[10px] tracking-[0.18em] uppercase font-headings px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: c.chip, color: c.text }}
                >
                    {t.label}
                </span>
            </div>
            <div className="font-mono text-2xl text-white">
                {t.price !== null ? Number(t.price).toFixed(2) : "—"}
            </div>
            <div className={`mt-1.5 font-mono text-base ${up ? "txt-up" : "txt-down"}`}>
                {up ? "▲" : "▼"} {up ? "+" : ""}{pct.toFixed(2)}%
            </div>
        </div>
    );
}
