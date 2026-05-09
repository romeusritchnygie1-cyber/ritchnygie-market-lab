import { useState, useEffect } from "react";
import api from "@/lib/api";
import { ExternalLink } from "lucide-react";

const TABS = [
    { key: "SPX",    label: "S&P 500",  color: "#60a5fa", bg: "card-blue"  },
    { key: "SILVER", label: "Silver",   color: "#67e8f9", bg: "card-cyan"  },
    { key: "GOLD",   label: "Gold",     color: "#fbbf24", bg: "card-amber" },
];

const fetchSpotlight = (symbol) =>
    api.get(`/news/spotlight/${symbol}`, { params: { limit: 12 } }).then((r) => r.data);

export default function SpotlightNews() {
    const [tab, setTab] = useState(TABS[0]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                const r = await fetchSpotlight(tab.key);
                if (mounted) setItems(r.items || []);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        const id = setInterval(load, 120000);
        return () => { mounted = false; clearInterval(id); };
    }, [tab]);

    return (
        <div className="rtl-card-pro p-6" data-testid="spotlight-news">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <div className="rtl-eyebrow rtl-eyebrow-strong">Market Spotlight News</div>
                    <p className="text-sm txt-sec mt-1">Headlines moving the 3 markets you trade</p>
                </div>
                <div className="flex gap-2">
                    {TABS.map((t) => {
                        const active = tab.key === t.key;
                        return (
                            <button
                                key={t.key}
                                onClick={() => setTab(t)}
                                data-testid={`spotlight-tab-${t.key}`}
                                className="text-xs tracking-[0.22em] uppercase font-headings px-3 py-1.5 rounded transition-all border"
                                style={
                                    active
                                        ? { borderColor: t.color + "80", backgroundColor: t.color + "20", color: t.color }
                                        : { borderColor: "transparent", color: "var(--rtl-text-muted)" }
                                }
                            >
                                {t.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {loading && items.length === 0
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={`sk-${i}`} className="h-20 bg-white/[0.03] rounded animate-pulse" />
                    ))
                    : items.map((n) => (
                        <a
                            key={`${n.url}-${n.title}`}
                            href={n.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${tab.bg} rounded p-3 group hover:-translate-y-0.5 transition-transform`}
                            data-testid={`spotlight-item-${n.title.slice(0, 20)}`}
                            style={{ borderLeft: `3px solid ${tab.color}` }}
                        >
                            <p className="text-sm text-white leading-snug group-hover:text-blue-300 font-body">
                                {n.title}
                                <ExternalLink size={12} className="inline ml-1 txt-mute" />
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase font-headings txt-mute">
                                <span>{n.publisher}</span>
                                {n.published_at && <><span>·</span><span>{formatTime(n.published_at)}</span></>}
                            </div>
                        </a>
                    ))}
            </div>
            {!loading && items.length === 0 && (
                <div className="text-center py-8 txt-mute text-sm">
                    No fresh headlines. Try another market.
                </div>
            )}
        </div>
    );
}

function formatTime(s) {
    try {
        const d = new Date(s);
        const diff = (Date.now() - d.getTime()) / 1000;
        if (diff < 60)    return "just now";
        if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return d.toLocaleDateString();
    } catch { return s; }
}
