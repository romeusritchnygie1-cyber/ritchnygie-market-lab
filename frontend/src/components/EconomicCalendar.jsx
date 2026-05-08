import { usePolling } from "@/lib/usePolling";
import { fetchCalendar } from "@/lib/api";
import { AlertTriangle, CalendarDays } from "lucide-react";

const IMPACT_COLOR = {
    high: "txt-down",
    medium: "txt-warn",
    low: "txt-sec",
};

export default function EconomicCalendar({ compact = false }) {
    const { data, loading } = usePolling(fetchCalendar, 5 * 60 * 1000, []);
    const events = data?.events || [];
    const limit = compact ? 4 : events.length;

    return (
        <div className="rtl-card p-5" data-testid="economic-calendar">
            <div className="flex items-center justify-between mb-3">
                <div className="rtl-eyebrow flex items-center gap-2">
                    <CalendarDays size={12} /> Economic Calendar Risk Filter
                </div>
                <span className="text-[10px] tracking-[0.18em] uppercase txt-mute font-headings">
                    UTC
                </span>
            </div>

            {data?.risk_warning && (
                <div className="mb-4 p-3 border border-orange-500/30 bg-orange-500/5 rounded flex items-start gap-2">
                    <AlertTriangle size={16} className="txt-warn mt-0.5 shrink-0" />
                    <p className="text-xs txt-warn font-body">{data.risk_warning}</p>
                </div>
            )}

            {loading ? (
                <div className="h-24 flex items-center justify-center txt-mute text-sm">Loading…</div>
            ) : (
                <div className="divide-y divide-white/[0.06]">
                    {events.slice(0, limit).map((ev) => (
                        <div
                            key={ev.name + ev.date}
                            className="flex items-center justify-between py-3"
                            data-testid={`event-${ev.name.replace(/\s+/g, "-")}`}
                        >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={`mt-0.5 w-1.5 h-1.5 rounded-full ${
                                    ev.impact === "high" ? "bg-red-500" : ev.impact === "medium" ? "bg-amber-500" : "bg-zinc-500"
                                }`} />
                                <div className="min-w-0">
                                    <div className="font-headings font-medium text-sm text-white truncate">
                                        {ev.name}
                                    </div>
                                    <div className="text-[11px] tracking-[0.12em] uppercase txt-sec font-headings">
                                        {ev.category} · <span className={IMPACT_COLOR[ev.impact]}>{ev.impact} impact</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="font-mono text-xs text-white">{ev.date}</div>
                                <div className={`font-mono text-xs ${ev.risk_now ? "txt-warn" : "txt-mute"}`}>
                                    {ev.humanize}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
