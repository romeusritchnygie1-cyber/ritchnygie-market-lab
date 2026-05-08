import { usePolling } from "@/lib/usePolling";
import { fetchLondonSession } from "@/lib/api";
import { Clock } from "lucide-react";

export default function LondonSession() {
    const { data } = usePolling(fetchLondonSession, 60_000, []);

    if (!data) return null;

    const intensityClass =
        data.intensity === "peak" ? "txt-up" :
        data.intensity === "active" ? "text-white" : "txt-mute";

    // Simple progress bar for session window 7:00 - 16:00 UTC
    const [h, m] = data.now_utc.split(":").map((x) => parseInt(x));
    const minutesNow = h * 60 + (parseInt(m) || 0);
    const open = 7 * 60;
    const close = 16 * 60;
    const pct = Math.min(100, Math.max(0, ((minutesNow - open) / (close - open)) * 100));

    return (
        <div className="rtl-card p-5" data-testid="london-session">
            <div className="flex items-center justify-between mb-3">
                <div className="rtl-eyebrow flex items-center gap-2">
                    <Clock size={12} /> London Session
                </div>
                <span className="font-mono text-xs txt-sec">{data.now_utc}</span>
            </div>

            <div className="flex items-baseline justify-between mb-3">
                <div className={`font-headings font-bold text-xl ${intensityClass}`}>{data.phase}</div>
                <div className="font-mono text-xs txt-mute">{data.ttl}</div>
            </div>

            <div className="relative h-2 bg-white/[0.06] rounded">
                <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-zinc-400 to-white rounded"
                    style={{ width: `${data.in_session ? pct : 0}%` }}
                />
                <div className="absolute left-[44%] top-0 w-px h-full bg-white/30" title="NY Overlap starts" />
            </div>
            <div className="flex justify-between mt-1 text-[10px] tracking-[0.15em] uppercase font-headings txt-mute">
                <span>{data.open_utc} UTC</span>
                <span>NY Overlap</span>
                <span>{data.close_utc} UTC</span>
            </div>

            <p className="mt-4 text-xs txt-sec font-body leading-relaxed">
                Optimal Silver / SPX volatility window. Session-overlap typically delivers the cleanest macro setups.
            </p>
        </div>
    );
}
