import { useEffect, useRef, useState } from "react";
import { createChart, AreaSeries } from "lightweight-charts";
import api from "@/lib/api";
import { ArrowRight, Sparkles } from "lucide-react";

const fetchRatio = () => api.get("/gold-silver-ratio").then((r) => r.data);

export default function GoldSilverRatio() {
    const [data, setData] = useState(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const r = await fetchRatio();
                if (mounted) setData(r);
            } catch { /* ignore */ }
        };
        load();
        const id = setInterval(load, 90000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    // Init chart once
    useEffect(() => {
        if (!containerRef.current) return;
        const chart = createChart(containerRef.current, {
            autoSize: true,
            localization: { locale: "en-US" },
            layout: {
                background: { color: "transparent" },
                textColor: "rgba(255,255,255,0.55)",
                fontFamily: "JetBrains Mono",
                fontSize: 9,
            },
            grid: { vertLines: { visible: false }, horzLines: { visible: false } },
            rightPriceScale: { visible: false },
            leftPriceScale: { visible: false },
            timeScale: { visible: false },
            handleScroll: false,
            handleScale: false,
            crosshair: { mode: 0 },
        });
        chartRef.current = chart;
        seriesRef.current = chart.addSeries(AreaSeries, {
            lineColor: "#94a3b8",
            topColor: "rgba(148,163,184,0.25)",
            bottomColor: "rgba(148,163,184,0.0)",
            lineWidth: 1.5,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });
        return () => chart.remove();
    }, []);

    // Update chart when data arrives
    useEffect(() => {
        if (!data?.history?.length || !seriesRef.current) return;
        seriesRef.current.setData(data.history);
        // Recolor based on signal
        const sigColor =
            data.signal_color === "cyan"  ? "#67e8f9" :
            data.signal_color === "amber" ? "#fbbf24" : "#94a3b8";
        seriesRef.current.applyOptions({
            lineColor: sigColor,
            topColor: sigColor + "40",
            bottomColor: sigColor + "00",
        });
        chartRef.current?.timeScale().fitContent();
    }, [data]);

    if (!data || data.error) {
        return (
            <div className="rtl-card-pro p-6" data-testid="gold-silver-ratio">
                <div className="rtl-eyebrow rtl-eyebrow-strong">Gold / Silver Ratio</div>
                <div className="text-base txt-mute mt-3">Loading XAU/XAG ratio…</div>
            </div>
        );
    }

    const sigClass =
        data.signal_color === "cyan"  ? { card: "card-cyan",  text: "#67e8f9", bg: "rgba(103,232,249,0.18)" } :
        data.signal_color === "amber" ? { card: "card-amber", text: "#fbbf24", bg: "rgba(251,191,36,0.18)" } :
                                        { card: "card-blue",  text: "#a1a1aa", bg: "rgba(255,255,255,0.06)" };

    const pct = Math.max(0, Math.min(1, data.pct_in_range));
    const goldZoneEnd = ((data.thresholds.gold_favored_below - data.low_52w) / (data.high_52w - data.low_52w)) * 100;
    const silverZoneStart = ((data.thresholds.silver_favored_above - data.low_52w) / (data.high_52w - data.low_52w)) * 100;

    return (
        <div className={`${sigClass.card} rounded p-6`} data-testid="gold-silver-ratio">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} style={{ color: sigClass.text }} />
                        <div className="rtl-eyebrow rtl-eyebrow-strong">Gold / Silver Ratio</div>
                        <span className="text-[10px] tracking-[0.22em] uppercase font-headings txt-mute">
                            XAU / XAG
                        </span>
                    </div>
                    <p className="text-sm txt-sec">
                        Precious-metals relative-value gauge — your edge for choosing Silver vs Gold today.
                    </p>
                </div>
                <span
                    className="text-[11px] tracking-[0.30em] uppercase font-headings font-bold px-3 py-1.5 rounded"
                    style={{ backgroundColor: sigClass.bg, color: sigClass.text }}
                    data-testid="ratio-signal"
                >
                    {data.signal_strength.toUpperCase()} · {data.signal}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Big ratio */}
                <div className="lg:col-span-3">
                    <div className="rtl-eyebrow mb-1">Current</div>
                    <div className="font-mono font-medium text-5xl tracking-tight" style={{ color: sigClass.text }}>
                        {data.ratio.toFixed(2)}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                            <div className="rtl-eyebrow mb-0.5">Gold</div>
                            <div className="font-mono text-base text-amber-300">${data.gold_price.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="rtl-eyebrow mb-0.5">Silver</div>
                            <div className="font-mono text-base text-cyan-300">${data.silver_price.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* Sparkline */}
                <div className="lg:col-span-5 flex flex-col">
                    <div className="rtl-eyebrow mb-2">1Y History</div>
                    <div ref={containerRef} className="flex-1 min-h-[110px]" />
                </div>

                {/* Range gauge */}
                <div className="lg:col-span-4">
                    <div className="rtl-eyebrow mb-2">52-Week Range</div>
                    <div className="relative h-3 rounded-full overflow-hidden bg-white/5">
                        {/* gold zone (left) */}
                        <div
                            className="absolute top-0 left-0 h-full"
                            style={{
                                width: `${goldZoneEnd}%`,
                                background: "linear-gradient(90deg, rgba(251,191,36,0.45), rgba(251,191,36,0.15))",
                            }}
                        />
                        {/* neutral zone (middle) */}
                        <div
                            className="absolute top-0 h-full"
                            style={{
                                left: `${goldZoneEnd}%`,
                                width: `${silverZoneStart - goldZoneEnd}%`,
                                background: "rgba(255,255,255,0.06)",
                            }}
                        />
                        {/* silver zone (right) */}
                        <div
                            className="absolute top-0 right-0 h-full"
                            style={{
                                width: `${100 - silverZoneStart}%`,
                                background: "linear-gradient(90deg, rgba(103,232,249,0.15), rgba(103,232,249,0.45))",
                            }}
                        />
                        {/* current marker */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-5 rounded-sm border-2 shadow-md"
                            style={{
                                left: `calc(${pct * 100}% - 5px)`,
                                backgroundColor: sigClass.text,
                                borderColor: "#fff",
                            }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 font-mono text-[11px]">
                        <div className="text-amber-300">{data.low_52w}</div>
                        <div className="txt-mute">·  78  ·  82  ·</div>
                        <div className="text-cyan-300">{data.high_52w}</div>
                    </div>
                    <div className="flex justify-between mt-1 text-[9px] tracking-[0.18em] uppercase font-headings txt-mute">
                        <span>Gold favored</span>
                        <span>Neutral</span>
                        <span>Silver favored</span>
                    </div>
                </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-start gap-2">
                <ArrowRight size={14} style={{ color: sigClass.text }} className="mt-0.5 shrink-0" />
                <p className="text-sm text-white/85 leading-relaxed">{data.commentary}</p>
            </div>
        </div>
    );
}
