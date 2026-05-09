import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ShieldAlert, ExternalLink, Globe } from "lucide-react";

const fetchAlerts = (severity = "medium") =>
    api.get("/geopolitical-alerts", { params: { limit: 12, severity } }).then((r) => r.data);

const SEV_STYLE = {
    PEAK:   { bg: "rgba(248,113,113,0.22)", text: "#fca5a5", border: "rgba(248,113,113,0.65)", card: "card-red" },
    HIGH:   { bg: "rgba(251,146,60,0.22)",  text: "#fdba74", border: "rgba(251,146,60,0.55)",  card: "card-orange" },
    MEDIUM: { bg: "rgba(251,191,36,0.20)",  text: "#fcd34d", border: "rgba(251,191,36,0.50)",  card: "card-amber" },
    LOW:    { bg: "rgba(148,163,184,0.18)", text: "#cbd5e1", border: "rgba(148,163,184,0.40)", card: "card-navy" },
};

function timeAgo(iso) {
    if (!iso) return "";
    try {
        const dt = new Date(iso);
        const mins = Math.max(0, Math.round((Date.now() - dt.getTime()) / 60000));
        if (mins < 60) return `${mins}m ago`;
        const h = Math.round(mins / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.round(h / 24)}d ago`;
    } catch { return ""; }
}

function AlertRow({ a }) {
    const sty = SEV_STYLE[a.severity_label] || SEV_STYLE.LOW;
    return (
        <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 rounded transition-all hover:bg-white/[0.04] border border-transparent hover:border-white/10"
            data-testid={`geo-alert-${a.severity}`}
        >
            <div className="flex items-start gap-3">
                <span
                    className="shrink-0 mt-0.5 text-[9px] tracking-[0.26em] uppercase font-headings font-bold px-2 py-1 rounded"
                    style={{ backgroundColor: sty.bg, color: sty.text, border: `1px solid ${sty.border}` }}
                >
                    {a.severity_label}
                </span>
                <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/95 leading-snug font-medium mb-1.5">
                        {a.title}
                        <ExternalLink size={11} className="inline ml-1.5 text-white/40" />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="txt-mute">{a.publisher || "Wire"}</span>
                        <span className="txt-mute">·</span>
                        <span className="txt-mute">{timeAgo(a.published_at)}</span>
                        {a.matched_keywords?.length > 0 && (
                            <>
                                <span className="txt-mute">·</span>
                                <span className="text-amber-300/80">{a.matched_keywords.slice(0, 3).join(", ")}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </a>
    );
}

export default function GeoAlerts() {
    const [data, setData] = useState(null);
    const [severity, setSeverity] = useState("medium");

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const r = await fetchAlerts(severity);
                if (mounted) setData(r);
            } catch (err) {
                console.error("[GeoAlerts]", err);
            }
        };
        load();
        const id = setInterval(load, 5 * 60_000);
        return () => { mounted = false; clearInterval(id); };
    }, [severity]);

    const compSty = SEV_STYLE[(data?.composite_label || "LOW")] || SEV_STYLE.LOW;

    return (
        <div className={`${compSty.card} rounded p-6`} data-testid="geo-alerts">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                    <div className="rtl-eyebrow rtl-eyebrow-strong flex items-center gap-2" style={{ color: compSty.text }}>
                        <ShieldAlert size={14} />
                        Geopolitical Risk Radar
                    </div>
                    <p className="text-sm txt-sec mt-1">
                        Real-time scan across SPX·Gold·Silver·DXY·Banks · ranked by severity & recency
                    </p>
                </div>
                <div className="flex items-center gap-2" data-testid="geo-severity-filter">
                    {[
                        { key: "medium", label: "ALL" },
                        { key: "high",   label: "HIGH+" },
                        { key: "peak",   label: "PEAK" },
                    ].map((s) => (
                        <button
                            key={s.key}
                            onClick={() => setSeverity(s.key)}
                            data-testid={`geo-filter-${s.key}`}
                            className={`text-[10px] tracking-[0.22em] uppercase font-headings px-2.5 py-1.5 rounded border transition-all ${
                                severity === s.key
                                    ? "text-white border-white/40 bg-white/10"
                                    : "txt-mute border-transparent hover:text-white"
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {data?.composite_message && (
                <div
                    className="mb-4 px-4 py-2.5 rounded text-sm font-mono leading-relaxed flex items-start gap-2"
                    style={{ backgroundColor: compSty.bg, color: compSty.text, border: `1px solid ${compSty.border}` }}
                    data-testid="geo-composite"
                >
                    <Globe size={14} className="mt-0.5 shrink-0" />
                    <span><span className="font-bold tracking-wider">{data.composite_label}</span> · {data.composite_message}</span>
                </div>
            )}

            <div className="space-y-1">
                {data?.alerts?.length ? (
                    data.alerts.map((a, i) => <AlertRow key={`${a.title}-${i}`} a={a} />)
                ) : (
                    <div className="text-sm txt-mute py-4">No geopolitical headlines matching this filter.</div>
                )}
            </div>

            {data?.count > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 text-[11px] tracking-[0.20em] uppercase font-headings txt-mute">
                    Showing {data.alerts.length} of {data.count} matched · {data.sources_scanned} sources scanned
                </div>
            )}
        </div>
    );
}
