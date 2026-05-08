import { usePolling } from "@/lib/usePolling";
import { fetchHero } from "@/lib/api";
import api from "@/lib/api";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const fetchGold = () => api.get("/quote/GOLD").then((r) => r.data);

export default function HeroDual() {
    const { data: spx, loading: l1 } = usePolling(fetchHero, 15000, []);
    const { data: gold, loading: l2 } = usePolling(fetchGold, 30000, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" data-testid="hero-dual">
            <HeroCard
                title="S&P 500 CFD"
                broker="FundedNext"
                instrument="primary"
                data={spx}
                loading={l1}
                variant="primary"
            />
            <HeroCard
                title="Gold (XAUUSD)"
                broker="OANDA"
                instrument="commodity"
                data={gold}
                loading={l2}
                variant="gold"
            />
        </div>
    );
}

function HeroCard({ title, broker, data, loading, variant }) {
    const heroClass = variant === "gold" ? "rtl-hero-gold" : "rtl-hero";
    const dotClass = variant === "gold" ? "live-dot live-dot-gold" : "live-dot";

    if (loading || !data) {
        return (
            <div className={`${heroClass} rounded p-7`} data-testid={`hero-${variant}`}>
                <div className="flex items-center gap-3 mb-2">
                    <div className={dotClass} />
                    <div className="rtl-eyebrow">Loading…</div>
                </div>
                <div className="rtl-hero-price text-4xl txt-mute">—</div>
            </div>
        );
    }

    const up = (data.change ?? 0) >= 0;
    const Arrow = up ? ArrowUpRight : ArrowDownRight;

    return (
        <div className={`${heroClass} rounded p-7 relative`} data-testid={`hero-${variant}`}>
            <div className="flex items-start justify-between flex-wrap gap-4 relative z-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={dotClass} />
                        <div className="rtl-eyebrow">{title}</div>
                        <div className="text-[9px] tracking-[0.28em] uppercase txt-mute font-headings">
                            via {broker}
                        </div>
                    </div>
                    <div className={`rtl-hero-price text-4xl md:text-5xl ${variant === "gold" ? "txt-accent" : ""}`}>
                        {data.price !== null ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                    </div>
                    <div className={`mt-3 flex items-center gap-2 font-mono text-sm ${up ? "txt-up" : "txt-down"}`}>
                        <Arrow size={16} />
                        <span>{up ? "+" : ""}{(data.change ?? 0).toFixed(2)}</span>
                        <span className="txt-mute">·</span>
                        <span>{up ? "+" : ""}{(data.change_pct ?? 0).toFixed(3)}%</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 self-start">
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
            <div className="rtl-eyebrow mb-0.5">{label}</div>
            <div className="font-mono text-sm">
                {value !== null && value !== undefined ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
            </div>
        </div>
    );
}
