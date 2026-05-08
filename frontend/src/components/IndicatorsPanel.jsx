import { useEffect, useState } from "react";
import { fetchIndicators } from "@/lib/api";
import { Activity, TrendingUp, Gauge } from "lucide-react";

const SYMBOLS = ["SPX", "GOLD", "SILVER", "DXY"];

export default function IndicatorsPanel() {
    const [data, setData] = useState({});

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const out = {};
            for (const s of SYMBOLS) {
                try { out[s] = await fetchIndicators(s); } catch { /* ignore */ }
            }
            if (mounted) setData(out);
        };
        load();
        const id = setInterval(load, 5 * 60_000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    return (
        <div className="rtl-card p-5" data-testid="indicators-panel">
            <div className="flex items-center justify-between mb-4">
                <div className="rtl-eyebrow flex items-center gap-2">
                    <Activity size={12} /> Indicators (ATR · ADX · RSI)
                </div>
                <span className="text-[10px] tracking-[0.18em] uppercase txt-mute font-headings">Daily</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SYMBOLS.map((s) => {
                    const d = data[s];
                    if (!d || d.error) {
                        return (
                            <div key={s} className="border border-white/[0.06] rounded p-3">
                                <div className="font-headings font-bold text-white">{s}</div>
                                <div className="text-xs txt-mute mt-1">Loading…</div>
                            </div>
                        );
                    }
                    return (
                        <div key={s} className="border border-white/[0.06] rounded p-3" data-testid={`ind-${s}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-headings font-bold text-white tracking-tight">{s}</div>
                                <span className="font-mono text-xs txt-sec">{d.close}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <Metric icon={Gauge} label="RSI" value={d.rsi} state={d.rsi_state} />
                                <Metric icon={TrendingUp} label="ADX" value={d.adx} state={d.adx_state} />
                                <Metric icon={Activity} label="ATR%" value={d.atr_pct} state={`${d.atr}`} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Metric({ icon: Icon, label, value, state }) {
    const colorRSI = label === "RSI"
        ? value >= 70 ? "txt-down" : value <= 30 ? "txt-up" : "text-white"
        : "text-white";
    return (
        <div>
            <div className="flex items-center justify-center gap-1 text-[10px] tracking-[0.18em] uppercase txt-mute font-headings">
                <Icon size={10} /> {label}
            </div>
            <div className={`font-mono text-base mt-1 ${colorRSI}`}>{value ?? "—"}</div>
            <div className="text-[10px] txt-sec mt-0.5">{state}</div>
        </div>
    );
}
