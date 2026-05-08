import { useEffect, useState } from "react";
import Header from "@/components/Header";
import TickerStrip from "@/components/TickerStrip";
import TradeForm from "@/components/TradeForm";
import { fetchTrades, deleteTrade } from "@/lib/api";
import { Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function Journal() {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            setLoading(true);
            const r = await fetchTrades(500);
            setTrades(r.trades || []);
        } catch (e) {
            /* ignore */
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const onDelete = async (id) => {
        if (!window.confirm("Delete this trade?")) return;
        try { await deleteTrade(id); toast.success("Deleted"); load(); }
        catch { toast.error("Delete failed"); }
    };

    const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);
    const wins = trades.filter((t) => (t.pnl || 0) > 0).length;
    const losses = trades.filter((t) => (t.pnl || 0) < 0).length;
    const winrate = trades.length ? (wins / trades.length * 100).toFixed(1) : "0.0";

    return (
        <div className="min-h-screen rtl-bg-base" data-testid="journal-page">
            <Header />
            <TickerStrip />

            <main className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-6">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div>
                        <div className="rtl-eyebrow">Trade Journal</div>
                        <h1 className="font-headings font-bold text-3xl md:text-4xl tracking-tight mt-1">
                            Journal &amp; Performance
                        </h1>
                    </div>
                    <TradeForm onSaved={load} />
                </div>

                {/* Stat row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <Stat label="Total Trades" value={trades.length} />
                    <Stat label="Winrate" value={`${winrate}%`} accent={winrate >= 50 ? "up" : "down"} />
                    <Stat label="Total P&L" value={`$${totalPnl.toFixed(2)}`} accent={totalPnl >= 0 ? "up" : "down"} />
                    <Stat label="W / L" value={`${wins} / ${losses}`} />
                </div>

                <div className="rtl-card-pro overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                        <div className="rtl-eyebrow rtl-eyebrow-strong">Entries</div>
                        <span className="text-[10px] tracking-[0.18em] uppercase txt-mute font-headings">
                            Most recent first
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center txt-mute text-sm">Loading trades…</div>
                    ) : trades.length === 0 ? (
                        <div className="p-10 text-center txt-mute text-sm">
                            No trades yet. Click <span className="text-white">Log Trade</span> to add your first entry.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[10px] tracking-[0.18em] uppercase txt-mute font-headings border-b border-white/[0.08]">
                                        <th className="text-left p-3 font-medium">Date</th>
                                        <th className="text-left p-3 font-medium">Symbol</th>
                                        <th className="text-left p-3 font-medium">Side</th>
                                        <th className="text-left p-3 font-medium">Session</th>
                                        <th className="text-left p-3 font-medium">Setup</th>
                                        <th className="text-right p-3 font-medium">Entry</th>
                                        <th className="text-right p-3 font-medium">Exit</th>
                                        <th className="text-right p-3 font-medium">P&L</th>
                                        <th className="text-right p-3 font-medium">R</th>
                                        <th className="text-left p-3 font-medium">Notes</th>
                                        <th className="p-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {trades.map((t) => {
                                        const up = (t.pnl ?? 0) >= 0;
                                        return (
                                            <tr key={t.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]" data-testid={`trade-row-${t.id}`}>
                                                <td className="p-3 font-mono text-xs txt-sec">{(t.traded_at || "").substring(0, 10)}</td>
                                                <td className="p-3 font-headings font-bold text-white">{t.symbol}</td>
                                                <td className={`p-3 font-mono text-xs uppercase ${t.side === "long" ? "txt-up" : "txt-down"}`}>{t.side}</td>
                                                <td className="p-3 font-mono text-xs txt-sec uppercase">{t.session}</td>
                                                <td className="p-3 text-xs txt-sec">{t.setup || "—"}</td>
                                                <td className="p-3 font-mono text-right text-white">{t.entry}</td>
                                                <td className="p-3 font-mono text-right txt-sec">{t.exit ?? "—"}</td>
                                                <td className={`p-3 font-mono text-right ${up ? "txt-up" : "txt-down"}`}>
                                                    {t.pnl !== null && t.pnl !== undefined ? `${up ? "+" : ""}${t.pnl.toFixed(2)}` : "—"}
                                                </td>
                                                <td className={`p-3 font-mono text-right ${(t.r_multiple ?? 0) >= 0 ? "txt-up" : "txt-down"}`}>
                                                    {t.r_multiple !== null && t.r_multiple !== undefined ? t.r_multiple.toFixed(2) + "R" : "—"}
                                                </td>
                                                <td className="p-3 text-xs txt-sec max-w-[280px] truncate" title={t.notes}>
                                                    {t.notes || "—"}
                                                    {t.screenshot_url && (
                                                        <a href={t.screenshot_url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center text-blue-400 hover:text-blue-300">
                                                            <ExternalLink size={11} />
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button onClick={() => onDelete(t.id)} className="txt-mute hover:txt-down" data-testid={`delete-${t.id}`}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function Stat({ label, value, accent }) {
    const cls = accent === "up" ? "txt-up" : accent === "down" ? "txt-down" : "text-white";
    return (
        <div className="rtl-card-pro p-4">
            <div className="rtl-eyebrow">{label}</div>
            <div className={`font-mono text-2xl mt-2 ${cls}`}>{value}</div>
        </div>
    );
}
