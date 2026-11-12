"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

type CursorState = "default" | "pointer" | "text" | "drag";

/**
 * Cursor: a small dot that tracks the mouse exactly, plus a soft ring that
 * follows with a little lag.
 *   - over links / buttons : ring grows and fills, dot shrinks
 *   - over text fields      : becomes a thin text bar
 *   - over [data-cursor=drag]: larger ring with a "drag" label
 *   - while pressing        : ring squeezes in
 * Only runs on devices with a real mouse; touch screens keep the default.
 */
export default function CustomCursor() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<CursorState>("default");
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { damping: 28, stiffness: 320, mass: 0.5 });
  const ringY = useSpring(y, { damping: 28, stiffness: 320, mass: 0.5 });

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    setEnabled(true);
    document.documentElement.classList.add("custom-cursor");

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);

      const t = e.target as HTMLElement | null;
      if (!t || !t.closest) return;
      if (t.closest("input:not([type=checkbox]):not([type=radio]), textarea, [contenteditable=true]")) {
        setState("text");
      } else if (t.closest("[data-cursor='drag']")) {
        setState("drag");
      } else if (t.closest("a, button, [role='button'], [role='switch'], select, label, [data-cursor='pointer']")) {
        setState("pointer");
      } else {
        setState("default");
      }
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    const leave = () => setVisible(false);
    const enter = () => setVisible(true);

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    document.documentElement.addEventListener("mouseleave", leave);
    document.documentElement.addEventListener("mouseenter", enter);
    return () => {
      document.documentElement.classList.remove("custom-cursor");
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.documentElement.removeEventListener("mouseenter", enter);
    };
  }, [x, y]);

  if (!enabled) return null;

  const ring = {
    default: { size: 34, fill: 0 },
    pointer: { size: 54, fill: 0.14 },
    text: { size: 0, fill: 0 },
    drag: { size: 72, fill: 0.1 },
  }[state];

  const dot =
    state === "text"
      ? { w: 2, h: 24, r: 1 }
      : state === "pointer"
        ? { w: 4, h: 4, r: 2 }
        : { w: 8, h: 8, r: 4 };

  const ease = { type: "spring" as const, stiffness: 420, damping: 32 };

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[95] hidden md:block">
      {/* ring (follows with a little lag) */}
      <motion.div
        className="absolute left-0 top-0"
        style={{ x: reduce ? x : ringX, y: reduce ? y : ringY, opacity: visible ? 1 : 0 }}
      >
        <div className="-translate-x-1/2 -translate-y-1/2">
          <motion.div
            className="flex items-center justify-center rounded-full border font-mono text-[10px] uppercase tracking-widest"
            style={{ borderColor: "var(--cursor-color)", color: "var(--cursor-color)" }}
            animate={{
              width: ring.size,
              height: ring.size,
              scale: pressed ? 0.82 : 1,
              opacity: state === "text" ? 0 : 0.7,
              backgroundColor: `rgba(100,255,218,${ring.fill})`,
            }}
            transition={ease}
          >
            {state === "drag" ? "drag" : null}
          </motion.div>
        </div>
      </motion.div>

      {/* dot (exact position) */}
      <motion.div className="absolute left-0 top-0" style={{ x, y, opacity: visible ? 1 : 0 }}>
        <div className="-translate-x-1/2 -translate-y-1/2">
          <motion.div
            style={{ backgroundColor: "var(--cursor-color)" }}
            animate={{ width: dot.w, height: dot.h, borderRadius: dot.r, scale: pressed ? 0.7 : 1 }}
            transition={ease}
          />
        </div>
      </motion.div>
    </div>
  );
}
