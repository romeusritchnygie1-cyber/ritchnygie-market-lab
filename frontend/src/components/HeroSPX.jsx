import { usePolling } from "@/lib/usePolling";
import { fetchHero } from "@/lib/api";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function HeroSPX() {
    const { data, loading } = usePolling(fetchHero, 15000, []);

    if (loading || !data) {
        return (
            <div className="rtl-hero rounded-md p-8" data-testid="hero-spx">
                <div className="rtl-eyebrow mb-4">Loading S&amp;P 500 CFD…</div>
                <div className="rtl-hero-price text-5xl txt-mute">—</div>
            </div>
        );
    }

    const up = (data.change ?? 0) >= 0;
    const Arrow = up ? ArrowUpRight : ArrowDownRight;

    return (
        <div className="rtl-hero rounded-md p-8 md:p-10 relative" data-testid="hero-spx">
            <div className="flex items-start justify-between flex-wrap gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="live-dot" />
                        <div className="rtl-eyebrow">{data.instrument}</div>
                        <div className="text-[10px] tracking-[0.22em] uppercase txt-mute font-headings">
                            via {data.broker}
                        </div>
                    </div>
                    <div className="rtl-hero-price text-5xl md:text-7xl">
                        {data.price !== null ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                    </div>
                    <div className={`mt-4 flex items-center gap-3 font-mono text-sm md:text-base ${up ? "txt-up" : "txt-down"}`}>
                        <Arrow size={20} />
                        <span>{up ? "+" : ""}{(data.change ?? 0).toFixed(2)}</span>
                        <span>·</span>
                        <span>{up ? "+" : ""}{(data.change_pct ?? 0).toFixed(3)}%</span>
                        <span className="txt-mute">today</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-10 gap-y-3 self-end">
                    <Stat label="Open"  value={data.open} />
                    <Stat label="High"  value={data.high} />
                    <Stat label="Low"   value={data.low} />
                    <Stat label="Prev"  value={data.prev_close} />
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div>
            <div className="rtl-eyebrow mb-1">{label}</div>
            <div className="font-mono text-base">
                {value !== null && value !== undefined ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
            </div>
        </div>
    );
}
