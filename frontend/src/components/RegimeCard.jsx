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

// Signal name → accent color (orange, blue, red, purple)
const SIGNAL_COLOR = {
    "ADX(14)":        { bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.30)", text: "#fb923c" },
    "VIX":            { bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.30)",  text: "#f87171" },
    "Risk Composite": { bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.30)", text: "#60a5fa" },
};

export default function RegimeCard() {
    const { data, loading } = usePolling(fetchRegime, 60000, []);

    return (
        <div className="rtl-card-pro p-6" data-testid="regime-card">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <div className="rtl-eyebrow rtl-eyebrow-strong">Market Regime Engine</div>
                    <p className="text-sm txt-sec mt-1">Auto-classified macro environment</p>
                </div>
                <span className="text-xs tracking-[0.18em] uppercase txt-mute font-headings">
                    Live
                </span>
            </div>

            {loading || !data ? (
                <div className="h-32 flex items-center justify-center txt-mute text-base">
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {data.signals.map((s) => {
                            const c = SIGNAL_COLOR[s.name] || SIGNAL_COLOR["Risk Composite"];
                            return (
                                <div
                                    key={s.name}
                                    className="rounded p-3 border"
                                    style={{ backgroundColor: c.bg, borderColor: c.border }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs tracking-[0.18em] uppercase font-headings font-bold" style={{ color: c.text }}>
                                            {s.name}
                                        </div>
                                        <div className="font-mono text-base text-white">
                                            {typeof s.value === "number" ? s.value.toFixed(2) : s.value}
                                        </div>
                                    </div>
                                    <div className="text-sm txt-sec leading-snug">{s.note}</div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
