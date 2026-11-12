"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, GraduationCap, Code2, Rocket } from "lucide-react";
import { defaultJourney } from "@/data/timeline";
import type { JourneyContent } from "@/lib/journey-schema";
import GlassCard from "@/components/ui/GlassCard";

const ICONS = [GraduationCap, Code2, Code2, Rocket, Rocket, Rocket, Rocket, Rocket, Rocket, Rocket];

/**
 * Horizontal timeline: small cards in a row you swipe / scroll sideways
 * (arrow buttons on the right for mouse users). Content is edited at
 * /admin/journey (defaults in src/data/timeline.ts).
 */
export default function Journey() {
  const reduce = useReducedMotion();
  const [journey, setJourney] = useState<JourneyContent>(defaultJourney);
  const steps = journey.steps;
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  // Content comes from /admin/journey; the defaults show until it loads.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/journey")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.journey?.steps?.length) setJourney(data.journey);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, steps.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };

  const arrow =
    "flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-primary/50 hover:text-white disabled:pointer-events-none disabled:opacity-30";

  return (
    <section id="journey" className="relative px-6 py-32">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-10 text-center"
        >
          <p className="mb-3 font-mono text-sm text-primary">Journey</p>
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            From first line of code to shipped products
          </h2>
        </motion.div>

        <div className="mb-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={!canLeft}
            aria-label="Scroll journey left"
            data-cursor="pointer"
            className={arrow}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={!canRight}
            aria-label="Scroll journey right"
            data-cursor="pointer"
            className={arrow}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={scroller}
          role="region"
          aria-label="Journey timeline — scroll sideways"
          tabIndex={0}
          className="flex snap-x snap-mandatory overflow-x-auto pb-4"
        >
          {steps.map((step, i) => {
            const Icon = ICONS[i] ?? Rocket;
            const last = i === steps.length - 1;
            return (
              <div key={`${step.title}-${i}`} className="flex w-48 shrink-0 snap-start flex-col pr-3 sm:w-56">
                {/* dot on the timeline; the line runs on to the next dot */}
                <div className="relative flex h-7 items-center">
                  <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-brand shadow-glow">
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </span>
                  {!last && (
                    <span aria-hidden className="absolute left-7 right-0 top-1/2 h-px bg-gradient-to-r from-primary/50 to-white/10" />
                  )}
                </div>
                <GlassCard className="mt-3 flex-1 p-3" glow="#57cbff">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <h3 className="font-display text-sm font-semibold text-white">{step.title}</h3>
                    {step.year && <span className="font-mono text-[11px] text-accent">{step.year}</span>}
                  </div>
                  {step.description && (
                    <p className="mt-1 line-clamp-2 font-body text-xs text-white/60">{step.description}</p>
                  )}
                </GlassCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
