"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const NAME = "ABHISHEK DHARIYAL";

type Particle = {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
};

function buildParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 0,
    y: 0,
    angle: Math.random() * Math.PI * 2,
    distance: 80 + Math.random() * 220,
    size: 1 + Math.random() * 3,
  }));
}

const RING_CIRCUMFERENCE = 2 * Math.PI * 26;

export default function Loader({ onDone }: { onDone: () => void }) {
  const [visibleChars, setVisibleChars] = useState(0);
  const [exploding, setExploding] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [particles] = useState(() => buildParticles(60));
  const percent = Math.round((visibleChars / NAME.length) * 100);

  useEffect(() => {
    if (visibleChars < NAME.length) {
      const t = setTimeout(() => setVisibleChars((v) => v + 1), 65);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setExploding(true), 350);
    return () => clearTimeout(t);
  }, [visibleChars]);

  useEffect(() => {
    if (!exploding) return;
    const t = setTimeout(() => setHidden(true), 900);
    const t2 = setTimeout(onDone, 1300);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [exploding, onDone]);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-base"
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
        >
          <div className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2">
            <svg width="64" height="64" className="-rotate-90">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#ffffff14" strokeWidth="3" />
              <motion.circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="url(#loaderGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                animate={{
                  strokeDashoffset: RING_CIRCUMFERENCE * (1 - percent / 100),
                }}
                transition={{ ease: "linear" }}
              />
              <defs>
                <linearGradient id="loaderGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-white/70">
              {percent}%
            </span>
          </div>

          <div className="relative mt-16 flex flex-wrap items-center justify-center gap-x-2 px-6 text-center">
            {!exploding &&
              NAME.split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  animate={
                    i < visibleChars ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }
                  }
                  transition={{ duration: 0.25 }}
                  className="font-display text-3xl font-semibold tracking-[0.15em] text-white sm:text-5xl"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}

            {exploding &&
              particles.map((p) => (
                <motion.span
                  key={p.id}
                  className="absolute left-1/2 top-1/2 rounded-full"
                  style={{
                    width: p.size * 4,
                    height: p.size * 4,
                    background:
                      p.id % 2 === 0
                        ? "rgba(124,58,237,0.9)"
                        : "rgba(59,130,246,0.9)",
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(p.angle) * p.distance,
                    y: Math.sin(p.angle) * p.distance,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              ))}

            {exploding && (
              <motion.span
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 1.6 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 rounded-full bg-primary/30 blur-2xl"
              />
            )}
          </div>

          <div className="absolute bottom-16 left-1/2 h-[2px] w-40 -translate-x-1/2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-gradient-brand"
              initial={{ width: "0%" }}
              animate={{ width: `${(visibleChars / NAME.length) * 100}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
