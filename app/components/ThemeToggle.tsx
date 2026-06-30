"use client";
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

const THEME_KEY = "pillr_theme";
type Theme = "light" | "dark";

export function applyTheme(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0B1118" : "#0F2438");
  }
  if (typeof window !== "undefined") localStorage.setItem(THEME_KEY, theme);
}

export function ThemeToggle({ variant = "sidebar" }: { variant?: "sidebar" | "header" }) {
  const [theme, setTheme] = useState<Theme>("light");

  // Sync the icon with whatever the no-flash inline script already applied
  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || "light";
    setTheme(current);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  if (variant === "header") {
    return (
      <button
        onClick={toggle}
        title={label}
        aria-label={label}
        style={{
          width: 38, height: 38, borderRadius: 9,
          background: "var(--card-bg)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--text-secondary)", flexShrink: 0,
        }}
      >
        {isDark ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
      </button>
    );
  }

  // Sidebar variant — matches the other faint icon buttons in the profile row
  return (
    <button
      onClick={toggle}
      title={label}
      aria-label={label}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: "rgba(255,255,255,0.45)",
        display: "flex", padding: 4, borderRadius: 6,
      }}
      className="sidebar-label"
    >
      {isDark ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
    </button>
  );
}
