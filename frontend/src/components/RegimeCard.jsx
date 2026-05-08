import { usePolling } from "@/lib/usePolling";
import { fetchRegime } from "@/lib/api";

const TAG_CLASS = {
    "Risk-On": "regime-risk-on",
    "Risk-Off": "regime-risk-off",
    "High Volatility": "regime-warn",
    "Low Volatility": "regime-trending",
    Trending: "regime-trending",
    Choppy: "regime-warn",
    "Low Liquidity": "regime-warn",
    Mixed: "regime-trending",
};

export default function RegimeCard() {
    const { data, loading } = usePolling(fetchRegime, 60000, []);

    return (
        <div className="rtl-card p-5" data-testid="regime-card">
            <div className="flex items-center justify-between mb-4">
                <div className="rtl-eyebrow">Market Regime Engine</div>
                <span className="text-[10px] tracking-[0.18em] uppercase txt-mute font-headings">
                    Auto-classified
                </span>
            </div>

            {loading || !data ? (
                <div className="h-32 flex items-center justify-center txt-mute text-sm">
                    Analyzing market structure…
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap gap-2 mb-5">
                        {data.tags.map((tag) => (
                            <span key={tag} className={`regime-badge ${TAG_CLASS[tag] || "regime-trending"}`}>
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="space-y-3">
                        {data.signals.map((s) => (
                            <div
                                key={s.name}
                                className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-2"
                            >
                                <div>
                                    <div className="text-[11px] tracking-[0.18em] uppercase txt-sec font-headings">
                                        {s.name}
                                    </div>
                                    <div className="text-xs txt-mute mt-0.5">{s.note}</div>
                                </div>
                                <div className="font-mono text-sm text-white shrink-0">
                                    {typeof s.value === "number" ? s.value.toFixed(2) : s.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
