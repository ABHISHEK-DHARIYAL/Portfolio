"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import { platformAbbr, platformColor } from "@/lib/platform-icon";

type Contest = {
  platform: string;
  handle: string;
  url: string;
  shortLabel?: string;
};

const layoutId = (c: Contest) => `profile-icon-${c.platform}-${c.url}`;

export default function CodingProfiles() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Contest | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/contests")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setContests(data.contests ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Esc closes the zoomed-in card.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);

  // Render nothing while loading or when there are no published profiles, so the
  // heading never flashes before disappearing after you delete every entry.
  if (loading || contests.length === 0) return null;

  return (
    <section id="coding-profiles" className="relative px-6 pb-32">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 font-mono text-sm text-primary">Coding Profiles</p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          className="flex flex-col items-center gap-6"
        >
          <div className="flex flex-wrap items-start justify-center gap-6 sm:gap-8">
            {contests.map((c) => {
              const color = platformColor(c.platform);
              const isActive = active && layoutId(active) === layoutId(c);
              return (
                <button
                  key={layoutId(c)}
                  onClick={() => setActive(c)}
                  data-cursor="pointer"
                  aria-label={`View ${c.platform} profile`}
                  className="group flex flex-col items-center gap-2.5"
                >
                  <motion.span
                    layoutId={layoutId(c)}
                    style={{ opacity: isActive ? 0 : 1 }}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg transition-transform duration-200 group-hover:-translate-y-1 sm:h-[4.5rem] sm:w-[4.5rem]"
                    // The badge's own background/border/shadow are set inline (not
                    // Tailwind) because the color is computed per-platform at
                    // runtime — see lib/platform-icon.ts.
                    initial={false}
                  >
                    <span
                      className="flex h-full w-full items-center justify-center rounded-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${color}33, ${color}12)`,
                        border: `1px solid ${color}55`,
                        boxShadow: `0 8px 24px -10px ${color}66`,
                      }}
                    >
                      <span className="font-display text-lg font-bold tracking-wide sm:text-xl" style={{ color }}>
                        {platformAbbr(c.platform, c.shortLabel)}
                      </span>
                    </span>
                  </motion.span>
                  <span className="font-mono text-[11px] text-white/50 group-hover:text-white/80">
                    {c.platform}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="font-mono text-[11px] text-white/30">
            Tap a platform to see the profile, or open it directly.
          </p>
        </motion.div>
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {active && (
              <motion.div
                className="fixed inset-0 z-[92] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActive(null)}
              >
                <motion.div
                  layoutId={layoutId(active)}
                  onClick={(e) => e.stopPropagation()}
                  className="theme-lock-dark w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[#0A0F24]/95 shadow-glow"
                >
                  <div className="flex items-start justify-between gap-4 p-6 pb-0">
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${platformColor(active.platform)}33, ${platformColor(active.platform)}12)`,
                        border: `1px solid ${platformColor(active.platform)}55`,
                        boxShadow: `0 8px 24px -10px ${platformColor(active.platform)}66`,
                      }}
                    >
                      <span
                        className="font-display text-xl font-bold tracking-wide"
                        style={{ color: platformColor(active.platform) }}
                      >
                        {platformAbbr(active.platform, active.shortLabel)}
                      </span>
                    </div>
                    <button
                      onClick={() => setActive(null)}
                      aria-label="Close"
                      className="rounded-full border border-white/10 p-2 text-white/50 transition hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-6 pt-4">
                    <h3 className="font-display text-xl font-semibold text-white">{active.platform}</h3>
                    {active.handle && (
                      <p className="mt-1 font-mono text-sm text-white/50">{active.handle}</p>
                    )}
                    <p className="mt-4 font-mono text-[11px] leading-relaxed text-white/30">
                      No public, reliable API exists for this platform&apos;s stats — visit the
                      profile directly for current numbers rather than a stale snapshot here.
                    </p>
                    <a
                      href={active.url}
                      target="_blank"
                      rel="noreferrer"
                      data-cursor="pointer"
                      className="mt-5 flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-5 py-3 font-body text-sm font-medium text-white shadow-glow transition hover:brightness-110"
                    >
                      Visit profile
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </section>
  );
}
