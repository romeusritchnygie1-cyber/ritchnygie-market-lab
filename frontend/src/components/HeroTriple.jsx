import { usePolling } from "@/lib/usePolling";
import { fetchHero } from "@/lib/api";
import api from "@/lib/api";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const fetchSilver = () => api.get("/quote/SILVER").then((r) => r.data);
const fetchGold = () => api.get("/quote/GOLD").then((r) => r.data);

const CARDS = [
    { key: "primary", title: "S&P 500 CFD", broker: "FundedNext", cardClass: "card-navy", priceColor: "#93c5fd", accent: "PRIMARY", fetcher: fetchHero,   ttl: 15000 },
    { key: "silver",  title: "Silver (XAGUSD)", broker: "OANDA",   cardClass: "card-cyan",  priceColor: "#67e8f9", accent: "PRECIOUS", fetcher: fetchSilver, ttl: 30000 },
    { key: "gold",    title: "Gold (XAUUSD)",   broker: "OANDA",   cardClass: "card-amber", priceColor: "#fbbf24", accent: "COMMODITY", fetcher: fetchGold,   ttl: 30000 },
];

export default function HeroTriple() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3" data-testid="hero-triple">
            {CARDS.map((c) => <HeroCard key={c.key} cfg={c} />)}
        </div>
    );
}

function HeroCard({ cfg }) {
    const { data, loading } = usePolling(cfg.fetcher, cfg.ttl, []);

    if (loading || !data) {
        return (
            <div className={`${cfg.cardClass} rounded p-6 min-h-[210px]`}>
                <div className="rtl-eyebrow mb-4">Loading {cfg.title}…</div>
                <div className="rtl-hero-price text-4xl txt-mute">—</div>
            </div>
        );
    }

    const up = (data.change ?? 0) >= 0;
    const Arrow = up ? ArrowUpRight : ArrowDownRight;

    return (
        <div className={`${cfg.cardClass} rounded p-6 relative`} data-testid={`hero-${cfg.key}`}>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span
                    className="text-[10px] tracking-[0.28em] uppercase font-headings font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: cfg.priceColor + "30", color: cfg.priceColor }}
                >
                    {cfg.accent}
                </span>
                <div className="rtl-eyebrow text-white">{cfg.title}</div>
            </div>
            <div className="text-[10px] tracking-[0.24em] uppercase txt-mute font-headings mb-2">
                via {cfg.broker}
            </div>

            <div className="rtl-hero-price text-4xl md:text-5xl mb-3" style={{ color: cfg.priceColor }}>
                {data.price !== null
                    ? data.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: cfg.key === "silver" ? 3 : 2,
                    })
                    : "—"}
            </div>

            <div className={`flex items-center gap-2 font-mono text-base mb-4 ${up ? "txt-up" : "txt-down"}`}>
                <Arrow size={18} />
                <span>{up ? "+" : ""}{(data.change ?? 0).toFixed(2)}</span>
                <span className="txt-mute">·</span>
                <span>{up ? "+" : ""}{(data.change_pct ?? 0).toFixed(3)}%</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-white/10">
                <Stat label="Open" value={data.open} />
                <Stat label="High" value={data.high} />
                <Stat label="Low"  value={data.low} />
                <Stat label="Prev" value={data.prev_close} />
            </div>
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div>
            <div className="rtl-eyebrow mb-0.5">{label}</div>
            <div className="font-mono text-sm text-white">
                {value !== null && value !== undefined ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
            </div>
        </div>
    );
}
