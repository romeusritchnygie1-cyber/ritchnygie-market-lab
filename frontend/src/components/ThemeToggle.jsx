import { useTheme, THEMES } from "@/lib/theme";
import { Sun, Moon, Compass } from "lucide-react";

const ICONS = { navy: Compass, dark: Moon, light: Sun };

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    return (
        <div className="flex items-center gap-1 border border-rtl-soft rounded-sm p-0.5" data-testid="theme-toggle">
            {Object.values(THEMES).map((t) => {
                const Icon = ICONS[t.key];
                const active = theme === t.key;
                return (
                    <button
                        key={t.key}
                        onClick={() => setTheme(t.key)}
                        data-testid={`theme-${t.key}`}
                        title={t.label}
                        className={`flex items-center gap-1 px-2 py-1 text-[9px] tracking-[0.22em] uppercase font-headings transition-colors ${
                            active ? "bg-rtl-up/15 text-rtl-up" : "txt-mute hover:text-white"
                        }`}
                    >
                        <Icon size={11} />
                        <span className="hidden md:inline">{t.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
