import { useEffect, useState } from "react";
import { fetchTickerBar } from "@/lib/api";

export default function TickerStrip() {
    const [tickers, setTickers] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const r = await fetchTickerBar();
                setTickers(r.tickers || []);
            } catch (e) { /* ignore */ }
        };
        load();
        const id = setInterval(load, 30000);
        return () => clearInterval(id);
    }, []);

    if (!tickers.length) {
        return (
            <div className="border-y border-white/[0.08] bg-[#0a0a0a] py-3 text-center txt-mute text-xs font-mono">
                Loading market tape...
            </div>
        );
    }

    const items = [...tickers, ...tickers]; // duplicate for seamless marquee

    return (
        <div
            className="border-y border-white/[0.08] bg-[#0a0a0a] py-3 overflow-hidden"
            data-testid="ticker-strip"
        >
            <div className="marquee">
                {items.map((t, i) => {
                    const up = (t.change_pct ?? 0) >= 0;
                    return (
                        <div
                            key={`${t.symbol}-${i}`}
                            className="flex items-center gap-3 px-4 border-r border-white/[0.06]"
                        >
                            <span className="font-headings tracking-[0.18em] uppercase text-xs text-white">
                                {t.label}
                            </span>
                            <span className="font-mono text-sm text-white">
                                {t.price !== null && t.price !== undefined ? t.price.toLocaleString() : "—"}
                            </span>
                            <span className={`font-mono text-xs ${up ? "txt-up" : "txt-down"}`}>
                                {up ? "▲" : "▼"} {Math.abs(t.change_pct ?? 0).toFixed(2)}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
