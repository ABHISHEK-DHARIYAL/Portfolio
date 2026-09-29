"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "site-theme";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "dark", toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Site-wide dark/light theme. The dark theme is this site's original,
 * fully-designed look; light mode is produced by a CSS override layer in
 * globals.css that targets the exact Tailwind utility classes already
 * used throughout the site (see the comment block there for the full
 * explanation) — this component's only job is deciding which theme is
 * active and writing that choice to <html data-theme="...">.
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  // Starts "dark" on the server and on first client render (so
  // server-rendered HTML and the first client render always match, which
  // React requires to avoid a hydration mismatch). The real preference —
  // saved choice, or the OS-level light/dark setting on a first visit —
  // is applied a moment later, in the effect below.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }
    // No saved preference yet — default to the OS/browser setting.
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    if (prefersLight) setTheme("light");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = () => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}
