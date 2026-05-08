import { usePolling } from "@/lib/usePolling";
import { fetchMacro } from "@/lib/api";

const ORDER = ["FEDFUNDS", "DGS10", "DGS2", "UNRATE", "CPIAUCSL"];

export default function MacroPanel() {
    const { data, loading } = usePolling(fetchMacro, 10 * 60_000, []);

    return (
        <div className="rtl-card p-5" data-testid="macro-panel">
            <div className="flex items-center justify-between mb-4">
                <div className="rtl-eyebrow">Federal Reserve · Macro</div>
                <span className="text-[10px] tracking-[0.18em] uppercase txt-mute font-headings">FRED</span>
            </div>

            {loading || !data ? (
                <div className="h-24 flex items-center justify-center txt-mute text-sm">Loading FRED data…</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {ORDER.map((id) => {
                        const d = data[id];
                        if (!d || d.value === null || d.value === undefined) {
                            return (
                                <div key={id} className="border border-white/[0.06] rounded p-3">
                                    <div className="rtl-eyebrow truncate">{id}</div>
                                    <div className="font-mono text-base mt-1 txt-mute">—</div>
                                </div>
                            );
                        }
                        const isUp = (d.change ?? 0) >= 0;
                        return (
                            <div key={id} className="border border-white/[0.06] rounded p-3" data-testid={`macro-${id}`}>
                                <div className="rtl-eyebrow truncate">{d.label}</div>
                                <div className="font-mono text-xl mt-1 text-white">
                                    {Number(d.value).toFixed(2)}
                                </div>
                                <div className={`text-[11px] mt-0.5 font-mono ${isUp ? "txt-up" : "txt-down"}`}>
                                    {d.change !== null && d.change !== undefined
                                        ? `${isUp ? "+" : ""}${d.change.toFixed(3)}`
                                        : ""}
                                </div>
                                <div className="text-[10px] mt-1 txt-mute font-mono">{d.date}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
