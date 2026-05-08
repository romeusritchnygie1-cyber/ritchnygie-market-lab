import { useEffect, useState, useCallback } from "react";

export const THEMES = {
    navy: {
        key: "navy", label: "Navy",
        "--rtl-bg-base": "#0a1628",
        "--rtl-bg-panel": "#0d1c33",
        "--rtl-bg-card": "#10223d",
        "--rtl-bg-hover": "#152a48",
        "--rtl-border-soft": "rgba(148, 184, 232, 0.12)",
        "--rtl-border-focus": "rgba(148, 184, 232, 0.35)",
        "--rtl-text-primary": "#f4f7fb",
        "--rtl-text-secondary": "#a8bdd9",
        "--rtl-text-muted": "#6b7d99",
        "--rtl-up": "#3b82f6",
        "--rtl-down": "#ef4444",
        "--rtl-warn": "#f59e0b",
        "--rtl-accent": "#fbbf24",
        "--rtl-grid": "rgba(148, 184, 232, 0.06)",
    },
    dark: {
        key: "dark", label: "Dark",
        "--rtl-bg-base": "#000000",
        "--rtl-bg-panel": "#060606",
        "--rtl-bg-card": "#0a0a0a",
        "--rtl-bg-hover": "#0f0f0f",
        "--rtl-border-soft": "rgba(255, 255, 255, 0.06)",
        "--rtl-border-focus": "rgba(255, 255, 255, 0.22)",
        "--rtl-text-primary": "#f4f4f5",
        "--rtl-text-secondary": "#a1a1aa",
        "--rtl-text-muted": "#52525b",
        "--rtl-up": "#3b82f6",
        "--rtl-down": "#ef4444",
        "--rtl-warn": "#f59e0b",
        "--rtl-accent": "#fbbf24",
        "--rtl-grid": "rgba(255, 255, 255, 0.04)",
    },
    light: {
        key: "light", label: "Light",
        "--rtl-bg-base": "#f5f5f7",
        "--rtl-bg-panel": "#ffffff",
        "--rtl-bg-card": "#ffffff",
        "--rtl-bg-hover": "#f0f0f3",
        "--rtl-border-soft": "rgba(15, 23, 42, 0.08)",
        "--rtl-border-focus": "rgba(15, 23, 42, 0.25)",
        "--rtl-text-primary": "#0f172a",
        "--rtl-text-secondary": "#475569",
        "--rtl-text-muted": "#94a3b8",
        "--rtl-up": "#1d4ed8",
        "--rtl-down": "#dc2626",
        "--rtl-warn": "#d97706",
        "--rtl-accent": "#b45309",
        "--rtl-grid": "rgba(15, 23, 42, 0.05)",
    },
};

const STORAGE_KEY = "rtl_theme";

export function applyTheme(themeKey) {
    const t = THEMES[themeKey] || THEMES.navy;
    const root = document.documentElement;
    Object.entries(t).forEach(([k, v]) => {
        if (k.startsWith("--")) root.style.setProperty(k, v);
    });
    root.setAttribute("data-rtl-theme", t.key);
    try { localStorage.setItem(STORAGE_KEY, t.key); } catch { /* ignore */ }
}

export function useTheme() {
    const [theme, setThemeState] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved && THEMES[saved] ? saved : "navy";
        } catch { return "navy"; }
    });

    useEffect(() => { applyTheme(theme); }, [theme]);

    const setTheme = useCallback((t) => setThemeState(t), []);
    return { theme, setTheme };
}
