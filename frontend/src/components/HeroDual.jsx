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
                data={spx}
                loading={l1}
                cardClass="card-navy"
                priceColor="#93c5fd"
                accentLabel="PRIMARY"
            />
            <HeroCard
                title="Gold (XAUUSD)"
                broker="OANDA"
                data={gold}
                loading={l2}
                cardClass="card-amber"
                priceColor="#fbbf24"
                accentLabel="COMMODITY"
            />
        </div>
    );
}

function HeroCard({ title, broker, data, loading, cardClass, priceColor, accentLabel }) {
    if (loading || !data) {
        return (
            <div className={`${cardClass} rounded p-7 min-h-[220px]`}>
                <div className="rtl-eyebrow mb-4">Loading {title}…</div>
                <div className="rtl-hero-price text-5xl txt-mute">—</div>
            </div>
        );
    }

    const up = (data.change ?? 0) >= 0;
    const Arrow = up ? ArrowUpRight : ArrowDownRight;

    return (
        <div className={`${cardClass} rounded p-7 relative`} data-testid={`hero-${accentLabel.toLowerCase()}`}>
            <div className="flex items-start justify-between flex-wrap gap-4 relative z-10">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span
                            className="text-[11px] tracking-[0.28em] uppercase font-headings font-bold px-2 py-0.5 rounded"
                            style={{ backgroundColor: priceColor + "30", color: priceColor }}
                        >
                            {accentLabel}
                        </span>
                        <div className="rtl-eyebrow text-white">{title}</div>
                        <div className="text-xs tracking-[0.22em] uppercase txt-mute font-headings">
                            via {broker}
                        </div>
                    </div>
                    <div className="rtl-hero-price text-5xl md:text-6xl" style={{ color: priceColor }}>
                        {data.price !== null ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                    </div>
                    <div className={`mt-3 flex items-center gap-2 font-mono text-base ${up ? "txt-up" : "txt-down"}`}>
                        <Arrow size={20} />
                        <span>{up ? "+" : ""}{(data.change ?? 0).toFixed(2)}</span>
                        <span className="txt-mute">·</span>
                        <span>{up ? "+" : ""}{(data.change_pct ?? 0).toFixed(3)}%</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 self-start">
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
            <div className="font-mono text-base text-white">
                {value !== null && value !== undefined ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
            </div>
        </div>
    );
}
