import { useEffect, useRef } from "react";

/**
 * TradingViewWidget — embeds TradingView's official advanced chart widget.
 * This is the same chart engine as tradingview.com — full candles, drawing tools,
 * indicators and timeframes — all free.
 */
export default function TradingViewWidget({
    symbol = "FOREXCOM:SPXUSD",
    interval = "60",
    height = 540,
    studies = ["STD;ATR", "STD;ADX", "STD;RSI"],
    instanceKey,
}) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;
        // Detect theme from CSS var to keep TV widget in sync
        const themeName = document.documentElement.getAttribute("data-rtl-theme") || "navy";
        const tvTheme = themeName === "light" ? "light" : "dark";
        const bgColor =
            getComputedStyle(document.documentElement).getPropertyValue("--rtl-bg-card").trim() ||
            "#0a0a0a";

        // Clear any previous widget
        containerRef.current.innerHTML = `<div id="tv-${instanceKey}" style="height:100%;width:100%;"></div>`;

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/tv.js";
        script.async = true;
        script.onload = () => {
            if (window.TradingView && document.getElementById(`tv-${instanceKey}`)) {
                new window.TradingView.widget({
                    container_id: `tv-${instanceKey}`,
                    symbol,
                    interval,
                    autosize: true,
                    timezone: "Etc/UTC",
                    theme: tvTheme,
                    style: "1",
                    locale: "en",
                    toolbar_bg: bgColor,
                    enable_publishing: false,
                    hide_legend: false,
                    save_image: false,
                    backgroundColor: bgColor,
                    gridColor: "rgba(148,184,232,0.06)",
                    studies,
                    withdateranges: true,
                    allow_symbol_change: false,
                    details: false,
                    hotlist: false,
                    calendar: false,
                });
            }
        };
        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) containerRef.current.innerHTML = "";
        };
    }, [symbol, interval, instanceKey, studies]);

    return (
        <div
            ref={containerRef}
            style={{ height, width: "100%" }}
            data-testid={`tv-widget-${instanceKey}`}
        />
    );
}
