import { useState } from "react";
import { usePolling } from "@/lib/usePolling";
import { fetchNews } from "@/lib/api";
import { ExternalLink } from "lucide-react";

const FILTERS = [
    { key: "all", label: "All" },
    { key: "institutional", label: "Institutions" },
    { key: "macro", label: "Macro" },
    { key: "tech", label: "Tech" },
];

export default function NewsFeed({ limit = 12, showFilters = true }) {
    const [filter, setFilter] = useState("all");
    const { data, loading } = usePolling(() => fetchNews(filter, limit), 60_000, [filter]);

    return (
        <div className="rtl-card p-5" data-testid="news-feed">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="rtl-eyebrow">Market Intelligence</div>
                {showFilters && (
                    <div className="flex gap-1">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                data-testid={`news-filter-${f.key}`}
                                className={`text-[10px] tracking-[0.18em] uppercase font-headings px-2 py-1 border transition-colors ${
                                    filter === f.key
                                        ? "border-white/50 text-white bg-white/[0.06]"
                                        : "border-white/[0.06] txt-sec hover:text-white"
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {loading && !data ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={`sk-${i}`} className="h-12 bg-white/[0.03] rounded animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="divide-y divide-white/[0.06]">
                    {(data?.items || []).slice(0, limit).map((n) => (
                        <a
                            key={`${n.url}-${n.title}`}
                            href={n.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block py-3 group"
                            data-testid={`news-item-${(n.title || "").slice(0, 24)}`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 border border-white/[0.12] txt-sec mt-0.5 shrink-0">
                                    {n.tag}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white group-hover:text-blue-400 transition-colors font-body leading-snug">
                                        {n.title}
                                        <ExternalLink size={11} className="inline ml-1 txt-mute" />
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] tracking-[0.12em] uppercase txt-mute font-headings">
                                        <span>{n.publisher}</span>
                                        {n.published_at && <><span>·</span><span>{formatTime(n.published_at)}</span></>}
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}
                    {!loading && (!data?.items || data.items.length === 0) && (
                        <div className="text-center py-10 txt-mute text-sm">
                            No headlines available right now.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function formatTime(s) {
    try {
        const d = new Date(s);
        const diff = (Date.now() - d.getTime()) / 1000;
        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return d.toLocaleDateString();
    } catch { return s; }
}
