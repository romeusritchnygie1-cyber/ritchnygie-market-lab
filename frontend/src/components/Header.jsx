import { Link, useLocation } from "react-router-dom";
import { Activity, Newspaper, Calendar as CalendarIcon, Layers, BookOpen, FlaskConical } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
    { to: "/", label: "Terminal", icon: Activity },
    { to: "/watchlist", label: "Watchlist", icon: Layers },
    { to: "/journal", label: "Journal", icon: BookOpen },
    { to: "/lab", label: "Lab", icon: FlaskConical },
    { to: "/news", label: "Intel", icon: Newspaper },
    { to: "/calendar", label: "Calendar", icon: CalendarIcon },
];

export default function Header() {
    const { pathname } = useLocation();
    return (
        <header
            className="sticky top-0 z-50 border-b border-rtl-soft backdrop-blur-xl"
            style={{ backgroundColor: "color-mix(in srgb, var(--rtl-bg-base) 85%, transparent)" }}
            data-testid="rtl-header"
        >
            <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between h-14">
                    <Link to="/" data-testid="rtl-logo" className="group">
                        <Logo size={28} />
                    </Link>

                    <nav className="flex items-center gap-1">
                        {NAV.map(({ to, label, icon: Icon }) => {
                            const active = pathname === to;
                            return (
                                <Link
                                    key={to}
                                    to={to}
                                    data-testid={`nav-${label.toLowerCase()}`}
                                    className={`flex items-center gap-2 px-3 py-2 text-[10px] font-headings tracking-[0.22em] uppercase transition-colors ${
                                        active ? "text-rtl-up" : "txt-mute hover:text-white"
                                    }`}
                                    style={active ? { borderBottom: "1px solid var(--rtl-up)" } : {}}
                                >
                                    <Icon size={12} />
                                    <span className="hidden md:inline">{label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <div className="hidden md:flex items-center gap-2">
                            <div className="live-dot" />
                            <span className="text-[9px] tracking-[0.28em] uppercase txt-sec font-headings">
                                Live · 24/7
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
