"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Command, Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const LINKS = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "journey", label: "Journey" },
  { id: "achievements", label: "Achievements" },
  { id: "github", label: "GitHub" },
  { id: "contact", label: "Contact" },
];

// Same destinations as the desktop nav, plus "Home" (the logo's own
// target) at the top — nothing invented, no section that doesn't
// already exist elsewhere on the page.
const MOBILE_LINKS = [{ id: "hero", label: "Home" }, ...LINKS];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("hero");
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = ["hero", ...LINKS.map((l) => l.id)];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0.1, 0.25, 0.5] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Close on Escape, lock body scroll while open — both only while the
  // mobile panel is actually mounted.
  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  // Close on outside click — anything outside the panel itself (the
  // backdrop already has its own onClick too; this also catches, e.g.,
  // a click on the fixed header behind the panel).
  useEffect(() => {
    if (!mobileOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [mobileOpen]);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const goTo = (id: string) => () => {
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    setMobileOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 1.4 }}
      className={`fixed left-0 top-0 z-[70] w-full transition-colors duration-300 ${
        // Unscrolled = sitting directly over the Hero's 3D canvas with no
        // background pill of its own. That used to force this navbar into
        // a permanent dark palette (a workaround for the Hero's canvas
        // background being hardcoded dark) — no longer needed, since
        // HeroScene.tsx now derives its background from the site theme
        // too, so plain text-white/border-white utilities are correct
        // here in both themes without any special-casing.
        scrolled ? "border-b border-white/10 bg-base/80 backdrop-blur-md" : ""
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <button
          onClick={goTo("hero")}
          className="font-display text-sm font-semibold tracking-widest text-white"
        >
          AD<span className="text-primary">.</span>
        </button>

        {/* Desktop nav — unchanged from before, still hidden below md */}
        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <li key={l.id} className="relative">
              <button
                onClick={goTo(l.id)}
                className={`font-body text-sm transition ${
                  active === l.id ? "text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {l.label}
              </button>
              {active === l.id && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute -bottom-1.5 left-0 h-[2px] w-full bg-gradient-brand"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="rounded-full border border-white/10 p-2 text-white/60 transition hover:border-primary/50 hover:text-white"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() =>
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true })
              )
            }
            className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 font-mono text-xs text-white/60 transition hover:border-primary/50 hover:text-white sm:flex"
          >
            <Command className="h-3.5 w-3.5" /> K
          </button>

          {/* Mobile menu toggle — only shown at the same breakpoint the
              desktop links disappear at, so exactly one nav UI is ever
              visible at a time. */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
            className="rounded-full border border-white/10 p-2 text-white/60 transition hover:border-primary/50 hover:text-white md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop — click anywhere on it to close (outside-click). */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
              className="fixed inset-0 top-0 z-[65] bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              id="mobile-nav-panel"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 right-0 top-[64px] z-[70] mx-4 overflow-hidden rounded-2xl border border-white/10 bg-base/95 shadow-glow backdrop-blur-xl md:hidden"
            >
              <ul className="flex flex-col gap-0.5 p-2">
                {MOBILE_LINKS.map((l, i) => (
                  <motion.li
                    key={l.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: reducedMotion ? 0 : 0.03 * i,
                      duration: reducedMotion ? 0 : 0.18,
                    }}
                  >
                    <button
                      onClick={goTo(l.id)}
                      className={`w-full rounded-xl px-4 py-3 text-left font-body text-sm transition ${
                        active === l.id
                          ? "bg-primary/15 text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {l.label}
                    </button>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
