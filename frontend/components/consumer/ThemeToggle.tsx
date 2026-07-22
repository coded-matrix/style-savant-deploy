"use client";

import { useEffect, useState } from "react";

/**
 * Dark-mode toggle. Persists to localStorage ("ss-theme") and flips the
 * `.dark` class on <html>. First visit follows prefers-color-scheme via the
 * inline bootstrap script in app/layout.tsx.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("ss-theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`grid h-9 w-9 place-items-center rounded-full ring-1 ring-line/50 text-ink transition-colors hover:bg-surface-low dark:text-off-white dark:ring-white/10 dark:hover:bg-white/5 ${className}`}
    >
      <span className="material-symbols-outlined text-[18px]">
        {dark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
