"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";

type CursorState = "default" | "pointer" | "text" | "drag";

const TRAIL_LENGTH = 6;

export default function CustomCursor() {
  const [state, setState] = useState<CursorState>("default");
  const [visible, setVisible] = useState(false);
  const [pulses, setPulses] = useState<{ id: number; x: number; y: number }[]>([]);
  const pulseId = useRef(0);
  const trailEls = useRef<(HTMLDivElement | null)[]>([]);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { damping: 25, stiffness: 300, mass: 0.4 });
  const springY = useSpring(y, { damping: 25, stiffness: 300, mass: 0.4 });

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    let pos = { x: -100, y: -100 };
    const trailPositions = Array.from({ length: TRAIL_LENGTH }, () => ({ x: -100, y: -100 }));

    const move = (e: MouseEvent) => {
      setVisible(true);
      pos = { x: e.clientX - 10, y: e.clientY - 10 };
      x.set(pos.x);
      y.set(pos.y);

      const target = e.target as HTMLElement;
      if (target.closest("input, textarea")) setState("text");
      else if (target.closest("[data-cursor='drag']")) setState("drag");
      else if (target.closest("a, button, [data-cursor='pointer']")) setState("pointer");
      else setState("default");
    };

    const click = (e: MouseEvent) => {
      const id = pulseId.current++;
      setPulses((p) => [...p, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setPulses((p) => p.filter((pl) => pl.id !== id)), 600);
    };

    const leave = () => setVisible(false);

    let raf = 0;
    const animateTrail = () => {
      let target = pos;
      trailPositions.forEach((tp, i) => {
        tp.x += (target.x - tp.x) * 0.35;
        tp.y += (target.y - tp.y) * 0.35;
        const el = trailEls.current[i];
        if (el) el.style.transform = `translate(${tp.x}px, ${tp.y}px)`;
        target = tp;
      });
      raf = requestAnimationFrame(animateTrail);
    };
    raf = requestAnimationFrame(animateTrail);

    window.addEventListener("mousemove", move);
    window.addEventListener("click", click);
    document.addEventListener("mouseleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("click", click);
      document.removeEventListener("mouseleave", leave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sizeFor: Record<CursorState, number> = {
    default: 20,
    pointer: 46,
    text: 4,
    drag: 56,
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] hidden md:block">
      {/* trail */}
      {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            trailEls.current[i] = el;
          }}
          className="absolute left-0 top-0 rounded-full bg-primary/40 transition-opacity"
          style={{
            width: 6 - i * 0.6,
            height: 6 - i * 0.6,
            opacity: visible ? 0.5 - i * 0.07 : 0,
          }}
        />
      ))}

      {/* glow */}
      <motion.div
        className="absolute left-0 top-0 rounded-full bg-primary/20 blur-xl"
        style={{ x: springX, y: springY, width: 70, height: 70, opacity: visible ? 1 : 0 }}
      />

      {/* main ring */}
      <motion.div
        className="absolute left-0 top-0 rounded-full border border-primary/70 mix-blend-difference"
        style={{
          x: springX,
          y: springY,
          width: sizeFor[state],
          height: sizeFor[state],
          opacity: visible ? 1 : 0,
        }}
        transition={{ width: 0.2, height: 0.2 }}
      />

      {/* click pulses */}
      <AnimatePresence>
        {pulses.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full border border-accent"
            style={{ left: p.x - 4, top: p.y - 4, width: 8, height: 8 }}
            initial={{ scale: 1, opacity: 0.9 }}
            animate={{ scale: 6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
