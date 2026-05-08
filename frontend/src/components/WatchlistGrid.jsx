import { usePolling } from "@/lib/usePolling";
import { fetchWatchlist } from "@/lib/api";

export default function WatchlistGrid() {
    const { data, loading } = usePolling(fetchWatchlist, 30_000, []);
    const items = data?.watchlist || [];

    return (
        <div className="rtl-card p-5" data-testid="watchlist-grid">
            <div className="flex items-center justify-between mb-4">
                <div className="rtl-eyebrow">Watchlist · Big Banks &amp; Semis</div>
                <span className="text-[10px] tracking-[0.18em] uppercase txt-mute font-headings">
                    AMD · ASML · TSM · GS · MS · BAC
                </span>
            </div>

            {loading ? (
                <div className="h-24 flex items-center justify-center txt-mute text-sm">Loading…</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[10px] tracking-[0.18em] uppercase txt-mute font-headings border-b border-white/[0.08]">
                                <th className="text-left py-2 pr-4 font-medium">Symbol</th>
                                <th className="text-left py-2 pr-4 font-medium">Name</th>
                                <th className="text-right py-2 pr-4 font-medium">Price</th>
                                <th className="text-right py-2 pr-4 font-medium">Change</th>
                                <th className="text-right py-2 font-medium">Range</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((q) => {
                                const up = (q.change_pct ?? 0) >= 0;
                                return (
                                    <tr key={q.symbol} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                                        <td className="py-3 pr-4 font-headings font-bold text-white">{q.symbol}</td>
                                        <td className="py-3 pr-4 txt-sec">{q.label}</td>
                                        <td className="py-3 pr-4 font-mono text-right text-white">
                                            {q.price !== null ? Number(q.price).toFixed(2) : "—"}
                                        </td>
                                        <td className={`py-3 pr-4 font-mono text-right ${up ? "txt-up" : "txt-down"}`}>
                                            {up ? "+" : ""}{(q.change_pct ?? 0).toFixed(2)}%
                                        </td>
                                        <td className="py-3 font-mono text-right txt-mute text-xs">
                                            {q.low ? `${q.low.toFixed(2)} – ${q.high.toFixed(2)}` : "—"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
