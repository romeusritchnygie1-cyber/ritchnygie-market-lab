import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createTrade } from "@/lib/api";
import { toast } from "sonner";

const SYMBOLS = ["SPX", "SILVER", "GOLD", "DXY", "VIX", "TNX", "DJI", "AAPL", "MSFT", "NVDA", "TSLA", "AMD", "ASML", "TSM", "GS", "MS", "BAC"];
const SIDES = ["long", "short"];
const SESSIONS = ["london", "ny", "asia", "overlap", "off"];
const SETUPS = ["Macro range break", "Regime flip", "London open drive", "Mean reversion", "VIX spike fade", "Trend pullback", "Other"];

export default function TradeForm({ onSaved }) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [form, setForm] = useState({
        symbol: "SPX",
        side: "long",
        session: "london",
        setup: "Macro range break",
        entry: "",
        exit: "",
        stop: "",
        target: "",
        size: "",
        pnl: "",
        r_multiple: "",
        regime: "",
        notes: "",
        screenshot_url: "",
        tags: "",
    });

    const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const submit = async () => {
        try {
            setBusy(true);
            const payload = {
                ...form,
                entry: Number(form.entry),
                exit: form.exit ? Number(form.exit) : null,
                stop: form.stop ? Number(form.stop) : null,
                target: form.target ? Number(form.target) : null,
                size: form.size ? Number(form.size) : null,
                pnl: form.pnl ? Number(form.pnl) : null,
                r_multiple: form.r_multiple ? Number(form.r_multiple) : null,
                tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
            };
            // Strip empty strings
            Object.keys(payload).forEach((k) => {
                if (payload[k] === "" || payload[k] === null) delete payload[k];
            });
            await createTrade(payload);
            toast.success("Trade logged");
            setOpen(false);
            setForm({ ...form, entry: "", exit: "", stop: "", target: "", size: "", pnl: "", r_multiple: "", notes: "", screenshot_url: "", tags: "" });
            onSaved?.();
        } catch (e) {
            toast.error(`Failed: ${e.response?.data?.detail || e.message}`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                data-testid="open-trade-form"
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/15 text-blue-400 border border-blue-500/40 hover:bg-blue-500/25 transition-colors text-[11px] tracking-[0.22em] uppercase font-headings"
            >
                <Plus size={14} /> Log Trade
            </button>

            {open && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" data-testid="trade-form-modal">
                    <div className="rtl-card-pro w-full max-w-2xl my-8">
                        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
                            <div className="rtl-eyebrow rtl-eyebrow-strong">New Trade Entry</div>
                            <button onClick={() => setOpen(false)} className="txt-mute hover:text-white" data-testid="close-trade-form">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 grid grid-cols-2 gap-4">
                            <Field label="Symbol">
                                <select className="rtl-input" value={form.symbol} onChange={upd("symbol")} data-testid="trade-symbol">
                                    {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </Field>
                            <Field label="Side">
                                <select className="rtl-input" value={form.side} onChange={upd("side")} data-testid="trade-side">
                                    {SIDES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                            </Field>
                            <Field label="Session">
                                <select className="rtl-input" value={form.session} onChange={upd("session")} data-testid="trade-session">
                                    {SESSIONS.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                            </Field>
                            <Field label="Setup">
                                <select className="rtl-input" value={form.setup} onChange={upd("setup")} data-testid="trade-setup">
                                    {SETUPS.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </Field>
                            <Field label="Entry"><input className="rtl-input font-mono" type="number" step="any" value={form.entry} onChange={upd("entry")} data-testid="trade-entry" /></Field>
                            <Field label="Exit"><input className="rtl-input font-mono" type="number" step="any" value={form.exit} onChange={upd("exit")} data-testid="trade-exit" /></Field>
                            <Field label="Stop"><input className="rtl-input font-mono" type="number" step="any" value={form.stop} onChange={upd("stop")} /></Field>
                            <Field label="Target"><input className="rtl-input font-mono" type="number" step="any" value={form.target} onChange={upd("target")} /></Field>
                            <Field label="Size"><input className="rtl-input font-mono" type="number" step="any" value={form.size} onChange={upd("size")} /></Field>
                            <Field label="P&L"><input className="rtl-input font-mono" type="number" step="any" value={form.pnl} onChange={upd("pnl")} data-testid="trade-pnl" /></Field>
                            <Field label="R Multiple"><input className="rtl-input font-mono" type="number" step="any" value={form.r_multiple} onChange={upd("r_multiple")} data-testid="trade-r" /></Field>
                            <Field label="Regime"><input className="rtl-input" value={form.regime} onChange={upd("regime")} placeholder="Trending / Risk-Off…" /></Field>
                            <Field label="Tags (comma)" full><input className="rtl-input" value={form.tags} onChange={upd("tags")} placeholder="cpi, london, breakout" /></Field>
                            <Field label="Screenshot URL" full><input className="rtl-input" value={form.screenshot_url} onChange={upd("screenshot_url")} placeholder="https://snipboard.io/..." /></Field>
                            <Field label="Notes" full>
                                <textarea className="rtl-input min-h-[80px]" value={form.notes} onChange={upd("notes")} placeholder="Reasoning, mistakes, learnings…" data-testid="trade-notes" />
                            </Field>
                        </div>
                        <div className="p-4 border-t border-white/[0.08] flex gap-2 justify-end">
                            <button onClick={() => setOpen(false)} className="px-4 py-2 text-[11px] tracking-[0.22em] uppercase font-headings txt-mute hover:text-white">
                                Cancel
                            </button>
                            <button
                                onClick={submit}
                                disabled={busy || !form.entry}
                                data-testid="save-trade"
                                className="px-5 py-2 text-[11px] tracking-[0.22em] uppercase font-headings bg-blue-500 text-black hover:bg-blue-400 disabled:opacity-40"
                            >
                                {busy ? "Saving…" : "Save Trade"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function Field({ label, full, children }) {
    return (
        <div className={full ? "col-span-2" : ""}>
            <div className="rtl-eyebrow mb-1.5">{label}</div>
            {children}
        </div>
    );
}
