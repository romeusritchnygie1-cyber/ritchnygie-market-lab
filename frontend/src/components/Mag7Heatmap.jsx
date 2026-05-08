import { usePolling } from "@/lib/usePolling";
import { fetchMag7 } from "@/lib/api";

export default function Mag7Heatmap() {
    const { data, loading } = usePolling(fetchMag7, 30000, []);
    const items = data?.mag7 || [];

    return (
        <div className="rtl-card p-5" data-testid="mag7-heatmap">
            <div className="flex items-center justify-between mb-4">
                <div className="rtl-eyebrow">Mag 7 Heatmap</div>
                <div className="text-[10px] tracking-[0.18em] uppercase txt-mute font-headings">
                    24h % change
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-md bg-white/[0.03] animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {items.map((t) => (
                        <Tile key={t.symbol} t={t} />
                    ))}
                </div>
            )}
        </div>
    );
}

function Tile({ t }) {
    const pct = t.change_pct ?? 0;
    const up = pct >= 0;
    // Map % change to opacity intensity
    const intensity = Math.min(0.55, Math.abs(pct) / 4); // 4% = full
    const bg = up
        ? `rgba(59,130,246,${0.08 + intensity})`
        : `rgba(239,68,68,${0.08 + intensity})`;

    return (
        <div
            className="heat-tile"
            style={{ backgroundColor: bg }}
            data-testid={`mag7-${t.symbol}`}
        >
            <div className="flex items-baseline justify-between">
                <div>
                    <div className="font-headings font-bold text-base text-white">{t.symbol}</div>
                    <div className="text-[10px] tracking-[0.15em] uppercase txt-sec font-headings">
                        {t.label}
                    </div>
                </div>
            </div>
            <div className="mt-3 font-mono text-sm text-white">
                {t.price !== null ? Number(t.price).toFixed(2) : "—"}
            </div>
            <div className={`mt-1 font-mono text-xs ${up ? "txt-up" : "txt-down"}`}>
                {up ? "+" : ""}{pct.toFixed(2)}%
            </div>
        </div>
    );
}
