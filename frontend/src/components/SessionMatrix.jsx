import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Clock, Coffee, TrendingUp, Moon } from "lucide-react";

const fetchSessions = () => api.get("/sessions").then((r) => r.data);

const ASSET_ICON = { SPX: TrendingUp, SILVER: Coffee, GOLD: Clock };

const STATUS_STYLE = {
    ACTIVE:  { bg: "rgba(52,211,153,0.18)", text: "#34d399", border: "rgba(52,211,153,0.55)" },
    WAITING: { bg: "rgba(148,163,184,0.18)", text: "#cbd5e1", border: "rgba(148,163,184,0.40)" },
    WEEKEND: { bg: "rgba(168,85,247,0.18)", text: "#c084fc", border: "rgba(168,85,247,0.40)" },
};

function AssetCard({ a }) {
    const Icon = ASSET_ICON[a.asset] || Clock;
    const sty = STATUS_STYLE[a.primary_status] || STATUS_STYLE.WAITING;
    const isActive = a.in_optimal_window;
    const cardClass = isActive
        ? "card-emerald"
        : a.primary_status === "WEEKEND" ? "card-purple" : "card-navy";

    return (
        <div className={`${cardClass} rounded p-4`} data-testid={`session-asset-${a.asset}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon size={16} style={{ color: a.color }} />
                    <div className="rtl-eyebrow rtl-eyebrow-strong" style={{ color: a.color }}>
                        {a.label}
                    </div>
                </div>
                <span
                    className="text-[9px] tracking-[0.24em] uppercase font-headings font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: sty.bg, color: sty.text, border: `1px solid ${sty.border}` }}
                >
                    {a.primary_status}
                </span>
            </div>
            <div className="font-mono text-2xl mb-1" style={{ color: sty.text }}>
                {a.primary_countdown}
            </div>
            <div className="text-[10px] tracking-[0.20em] uppercase font-headings txt-mute mb-3">
                {a.primary_window_name === "Closed" ? "Closed" : `Window: ${a.primary_window_name}`}
            </div>

            {/* Sub-windows */}
            <div className="space-y-1.5 pt-3 border-t border-white/10">
                {a.windows.map((w) => (
                    <div key={w.name} className="flex items-center justify-between text-[11px] font-mono">
                        <span className="txt-mute">{w.name} {w.tz_label}</span>
                        <span className={w.in_window ? "" : "txt-mute"} style={w.in_window ? { color: a.color } : {}}>
                            {w.open_local}–{w.close_local}
                            <span className="ml-2 text-[10px]">
                                {w.in_window ? "● LIVE" : "○"}
                            </span>
                        </span>
                    </div>
                ))}
            </div>

            <p className="mt-3 text-[11px] text-white/70 leading-relaxed italic">{a.rationale}</p>
        </div>
    );
}

export default function SessionMatrix() {
    const [data, setData] = useState(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const r = await fetchSessions();
                if (mounted) setData(r);
            } catch (err) {
                console.error("[SessionMatrix]", err);
            }
        };
        load();
        const id = setInterval(load, 60_000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    return (
        <div className="rtl-card-pro p-6" data-testid="session-matrix">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
                <div>
                    <div className="rtl-eyebrow rtl-eyebrow-strong flex items-center gap-2">
                        {data?.is_weekend ? <Moon size={14} className="text-purple-300" /> : <Clock size={14} className="text-blue-300" />}
                        Trading Sessions · Per-Asset Windows
                    </div>
                    <p className="text-sm txt-sec mt-1">
                        SPX · NY 11:00–15:45 ET  ·  Silver · London 08:00–16:00 UK  ·  Gold · Both
                    </p>
                </div>
                <div className="text-right">
                    <div className="rtl-eyebrow">Now</div>
                    <div className="font-mono text-sm text-white">{data?.now_utc || "—"}</div>
                </div>
            </div>

            {data?.headline && (
                <div className="mb-4 px-4 py-2.5 rounded text-sm tracking-wide font-mono"
                     style={{
                         backgroundColor: data.active_count > 0 ? "rgba(52,211,153,0.12)" : "rgba(148,163,184,0.10)",
                         color: data.active_count > 0 ? "#34d399" : "#cbd5e1",
                         border: `1px solid ${data.active_count > 0 ? "rgba(52,211,153,0.35)" : "rgba(148,163,184,0.20)"}`,
                     }}
                     data-testid="session-headline">
                    {data.headline}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {data?.assets?.map((a) => <AssetCard key={a.asset} a={a} />)}
            </div>
        </div>
    );
}
