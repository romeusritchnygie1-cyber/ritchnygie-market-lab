import { Link, useLocation } from "react-router-dom";
import { Activity, Newspaper, Calendar as CalendarIcon, Layers } from "lucide-react";

const NAV = [
    { to: "/", label: "Terminal", icon: Activity },
    { to: "/watchlist", label: "Watchlist", icon: Layers },
    { to: "/news", label: "Intel", icon: Newspaper },
    { to: "/calendar", label: "Calendar", icon: CalendarIcon },
];

export default function Header() {
    const { pathname } = useLocation();
    return (
        <header
            className="sticky top-0 z-50 border-b border-white/[0.08] backdrop-blur-xl bg-[#050505]/80"
            data-testid="rtl-header"
        >
            <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-3 group" data-testid="rtl-logo">
                        <div className="flex items-center gap-2">
                            <div className="font-headings font-bold text-2xl tracking-tight">RTL</div>
                            <div className="hidden md:block w-px h-5 bg-white/15" />
                            <div className="hidden md:block">
                                <div className="text-[10px] tracking-[0.22em] uppercase txt-mute font-headings">
                                    Ritchnygie
                                </div>
                                <div className="text-[10px] tracking-[0.22em] uppercase txt-sec font-headings">
                                    Trading Lab
                                </div>
                            </div>
                        </div>
                    </Link>

                    <nav className="flex items-center gap-1">
                        {NAV.map(({ to, label, icon: Icon }) => {
                            const active = pathname === to;
                            return (
                                <Link
                                    key={to}
                                    to={to}
                                    data-testid={`nav-${label.toLowerCase()}`}
                                    className={`flex items-center gap-2 px-3 py-2 text-xs font-headings tracking-[0.18em] uppercase transition-colors ${
                                        active
                                            ? "text-white border-b border-white"
                                            : "txt-sec hover:text-white"
                                    }`}
                                >
                                    <Icon size={14} />
                                    <span className="hidden md:inline">{label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="hidden md:flex items-center gap-2">
                        <div className="live-dot" />
                        <span className="text-[10px] tracking-[0.22em] uppercase txt-sec font-headings">
                            Live · Macro Intelligence
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
