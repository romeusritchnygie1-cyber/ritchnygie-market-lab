import { useEffect, useState } from "react";
import { fetchIndicators } from "@/lib/api";
import { Activity, TrendingUp, Gauge } from "lucide-react";

const SYMBOLS = [
    { sym: "SPX",    color: "card-blue",   text: "#60a5fa" },
    { sym: "SILVER", color: "card-cyan",   text: "#67e8f9" },
    { sym: "GOLD",   color: "card-amber",  text: "#fbbf24" },
    { sym: "DXY",    color: "card-purple", text: "#c084fc" },
];

export default function IndicatorsPanel() {
    const [data, setData] = useState({});

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const out = {};
            for (const { sym } of SYMBOLS) {
                try { out[sym] = await fetchIndicators(sym); } catch { /* ignore */ }
            }
            if (mounted) setData(out);
        };
        load();
        const id = setInterval(load, 5 * 60_000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    return (
        <div className="rtl-card-pro p-6" data-testid="indicators-panel">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <div className="rtl-eyebrow rtl-eyebrow-strong flex items-center gap-2">
                        <Activity size={14} /> Indicators
                    </div>
                    <p className="text-sm txt-sec mt-1">ATR · ADX · RSI on daily bars</p>
                </div>
                <span className="text-xs tracking-[0.18em] uppercase txt-mute font-headings">Daily</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SYMBOLS.map(({ sym, color, text }) => {
                    const d = data[sym];
                    if (!d || d.error) {
                        return (
                            <div key={sym} className={`${color} rounded p-4`}>
                                <div className="font-headings font-bold text-lg" style={{ color: text }}>{sym}</div>
                                <div className="text-sm txt-mute mt-1">Loading…</div>
                            </div>
                        );
                    }
                    return (
                        <div key={sym} className={`${color} rounded p-4`} data-testid={`ind-${sym}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="font-headings font-bold text-xl tracking-tight" style={{ color: text }}>
                                    {sym}
                                </div>
                                <span className="font-mono text-sm txt-sec">{d.close}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <Metric icon={Gauge}      label="RSI"  value={d.rsi}     state={d.rsi_state} accent="rsi"   raw={d.rsi} />
                                <Metric icon={TrendingUp} label="ADX"  value={d.adx}     state={d.adx_state} accent="trend" />
                                <Metric icon={Activity}   label="ATR%" value={d.atr_pct} state={`${d.atr}`}  accent="vol"   />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Metric({ icon: Icon, label, value, state, accent, raw }) {
    let valColor = "text-white";
    if (accent === "rsi" && raw !== undefined) {
        if (raw >= 70) valColor = "txt-down";   // overbought = red
        else if (raw <= 30) valColor = "txt-up"; // oversold = blue
        else if (raw >= 55) valColor = "txt-up";
        else if (raw <= 45) valColor = "txt-warn";
    } else if (accent === "trend") {
        valColor = "txt-warn"; // ADX = orange
    } else if (accent === "vol") {
        valColor = "txt-down"; // ATR / volatility = red
    }
    return (
        <div className="bg-black/20 rounded p-2.5">
            <div className="flex items-center justify-center gap-1 text-xs tracking-[0.16em] uppercase txt-mute font-headings">
                <Icon size={11} /> {label}
            </div>
            <div className={`font-mono text-xl mt-1.5 text-center ${valColor}`}>{value ?? "—"}</div>
            <div className="text-xs txt-sec mt-0.5 text-center">{state}</div>
        </div>
    );
}
