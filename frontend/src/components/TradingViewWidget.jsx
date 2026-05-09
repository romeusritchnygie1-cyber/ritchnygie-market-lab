import { useEffect, useRef } from "react";

/**
 * TradingViewWidget — embeds TradingView's official advanced chart widget.
 * Same chart engine as tradingview.com — full candles, drawing tools,
 * indicators and timeframes — all free. Uses safe DOM APIs (no innerHTML).
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
        const container = containerRef.current;
        if (!container) return;

        // Detect theme from CSS var to keep TV widget in sync
        const themeName = document.documentElement.getAttribute("data-rtl-theme") || "navy";
        const tvTheme = themeName === "light" ? "light" : "dark";
        const bgColor =
            getComputedStyle(document.documentElement).getPropertyValue("--rtl-bg-card").trim() ||
            "#0a0a0a";

        // Sanitize instanceKey aggressively — only allow safe DOM-id chars
        const safeKey = String(instanceKey || "default").replace(/[^a-zA-Z0-9_-]/g, "");

        // Clear container using safe DOM (no innerHTML)
        while (container.firstChild) container.removeChild(container.firstChild);

        // Create the inner mount node via createElement
        const mount = document.createElement("div");
        mount.id = `tv-${safeKey}`;
        mount.style.height = "100%";
        mount.style.width = "100%";
        container.appendChild(mount);

        // Inject the TradingView script
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/tv.js";
        script.async = true;
        script.onload = () => {
            if (window.TradingView && document.getElementById(mount.id)) {
                new window.TradingView.widget({
                    container_id: mount.id,
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
        container.appendChild(script);

        // Cleanup
        return () => {
            if (container) {
                while (container.firstChild) container.removeChild(container.firstChild);
            }
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
