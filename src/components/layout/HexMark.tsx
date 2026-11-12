"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Hexagon outline with the "AD" monogram inside.
 *
 * mode="draw"  — the outline draws itself once, then the letters fade in
 *                (used by the full-screen opening loader).
 * mode="pulse" — the outline stays drawn and gently pulses forever
 *                (used while data / pages are loading).
 */
export default function HexMark({
  size = 96,
  mode = "draw",
  className = "",
}: {
  size?: number;
  mode?: "draw" | "pulse";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const pulse = mode === "pulse" && !reduce;

  return (
    <motion.svg
      role="img"
      aria-label="AD logo"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      animate={pulse ? { opacity: [1, 0.45, 1] } : undefined}
      transition={pulse ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      <motion.polygon
        points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5"
        fill="none"
        stroke="var(--hex-color, #64ffda)"
        strokeWidth="5"
        strokeLinejoin="round"
        initial={mode === "draw" && !reduce ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: [0.645, 0.045, 0.355, 1] }}
      />
      <motion.text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--hex-color, #64ffda)"
        fontSize="34"
        fontWeight="700"
        letterSpacing="1"
        style={{ fontFamily: "var(--font-display), sans-serif" }}
        initial={mode === "draw" && !reduce ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ delay: mode === "draw" ? 0.7 : 0, duration: 0.4 }}
      >
        AD
      </motion.text>
    </motion.svg>
  );
}
