import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from "lightweight-charts";
import { API } from "@/lib/api";
import axios from "axios";

const TIMEFRAMES = [
    { label: "1D", period: "5d",  interval: "5m" },
    { label: "1W", period: "1mo", interval: "30m" },
    { label: "1M", period: "3mo", interval: "1d" },
    { label: "3M", period: "6mo", interval: "1d" },
    { label: "1Y", period: "1y",  interval: "1d" },
    { label: "5Y", period: "5y",  interval: "1wk" },
];

export default function CandleChart({ symbol = "SPX", label, height = 480 }) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const candleSeriesRef = useRef(null);
    const volumeSeriesRef = useRef(null);
    const ma20Ref = useRef(null);
    const ma50Ref = useRef(null);
    const [tf, setTf] = useState(TIMEFRAMES[2]);
    const [info, setInfo] = useState(null);
    const [err, setErr] = useState(null);

    // Initialize chart once
    useEffect(() => {
        if (!containerRef.current) return;
        const el = containerRef.current;
        const chart = createChart(el, {
            autoSize: true,
            localization: {
                locale: "en-US",
                dateFormat: "MMM dd, yyyy",
            },
            layout: {
                background: { color: "#000000" },
                textColor: "#a1a1aa",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
            },
            grid: {
                vertLines: { color: "rgba(255,255,255,0.04)" },
                horzLines: { color: "rgba(255,255,255,0.04)" },
            },
            crosshair: {
                mode: 1,
                vertLine: { color: "rgba(255,255,255,0.25)", width: 1, style: 2, labelBackgroundColor: "#3b82f6" },
                horzLine: { color: "rgba(255,255,255,0.25)", width: 1, style: 2, labelBackgroundColor: "#3b82f6" },
            },
            rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
            timeScale: {
                borderColor: "rgba(255,255,255,0.08)",
                timeVisible: true,
                secondsVisible: false,
            },
        });
        chartRef.current = chart;

        candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
            upColor: "#3b82f6",
            downColor: "#ef4444",
            wickUpColor: "#3b82f6",
            wickDownColor: "#ef4444",
            borderVisible: false,
        });

        volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
            priceFormat: { type: "volume" },
            priceScaleId: "volume",
        });
        chart.priceScale("volume").applyOptions({
            scaleMargins: { top: 0.85, bottom: 0 },
        });

        ma20Ref.current = chart.addSeries(LineSeries, {
            color: "rgba(245,158,11,0.85)",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });
        ma50Ref.current = chart.addSeries(LineSeries, {
            color: "rgba(255,255,255,0.55)",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        chart.subscribeCrosshairMove((param) => {
            if (!param || !param.seriesData) return;
            const c = param.seriesData.get(candleSeriesRef.current);
            if (c) setInfo(c);
        });

        return () => {
            chart.remove();
            chartRef.current = null;
        };
    }, [height]);

    // Load candles when symbol or tf changes
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setErr(null);
                const res = await axios.get(`${API}/ohlc/${symbol}`, {
                    params: { period: tf.period, interval: tf.interval },
                    timeout: 60000,
                });
                if (cancelled) return;
                const candles = res.data.candles || [];
                const volume = res.data.volume || [];
                candleSeriesRef.current?.setData(candles);
                volumeSeriesRef.current?.setData(volume);
                ma20Ref.current?.setData(sma(candles, 20));
                ma50Ref.current?.setData(sma(candles, 50));
                if (candles.length) {
                    setInfo(candles[candles.length - 1]);
                    chartRef.current?.timeScale().fitContent();
                    candleSeriesRef.current?.priceScale().applyOptions({ autoScale: true });
                }
            } catch (e) {
                if (!cancelled) setErr(e.message || "load failed");
            }
        };
        load();
        const id = setInterval(load, 60_000);
        return () => { cancelled = true; clearInterval(id); };
    }, [symbol, tf]);

    return (
        <div className="rtl-card-pro" data-testid={`candle-chart-${symbol}`}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06]">
                <div className="flex items-baseline gap-3">
                    <div className="font-headings font-bold text-lg tracking-tight text-white">{label || symbol}</div>
                    {info && (
                        <div className="hidden md:flex items-baseline gap-3 font-mono text-[11px] txt-sec">
                            <span>O <span className="text-white">{info.open}</span></span>
                            <span>H <span className="text-white">{info.high}</span></span>
                            <span>L <span className="text-white">{info.low}</span></span>
                            <span>C <span className={info.close >= info.open ? "txt-up" : "txt-down"}>{info.close}</span></span>
                        </div>
                    )}
                </div>
                <div className="flex gap-1">
                    {TIMEFRAMES.map((t) => (
                        <button
                            key={t.label}
                            onClick={() => setTf(t)}
                            data-testid={`tf-${t.label}-${symbol}`}
                            className={`text-[10px] tracking-[0.18em] uppercase font-headings px-2 py-1 transition-colors ${
                                tf.label === t.label
                                    ? "text-white border-b border-white"
                                    : "txt-mute hover:text-white"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>
            <div ref={containerRef} style={{ height, width: "100%" }} />
            {err && (
                <div className="px-5 py-2 text-[11px] txt-warn border-t border-white/[0.06] font-mono">
                    {err}
                </div>
            )}
            <div className="px-5 py-2 border-t border-white/[0.06] flex items-center gap-4 text-[10px] tracking-[0.15em] uppercase font-headings txt-mute">
                <span><span className="inline-block w-2 h-0.5 bg-amber-500 mr-1 align-middle" />MA20</span>
                <span><span className="inline-block w-2 h-0.5 bg-white/55 mr-1 align-middle" />MA50</span>
                <span className="ml-auto txt-mute">Auto-refresh 60s · {tf.interval} bars</span>
            </div>
        </div>
    );
}

function sma(candles, period) {
    const out = [];
    for (let i = period - 1; i < candles.length; i++) {
        let s = 0;
        for (let j = 0; j < period; j++) s += candles[i - j].close;
        out.push({ time: candles[i].time, value: s / period });
    }
    return out;
}
