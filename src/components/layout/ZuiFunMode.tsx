"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { useSound } from "./SoundProvider";

type NodeId = "head" | "chest" | "leftHand" | "rightHand" | "waist" | "leftFoot" | "rightFoot";

type NodeDef = {
  id: NodeId;
  x: number;
  y: number;
  label: string;
  blurb: string;
  target: string;
};

/**
 * Coordinates are on a 200x400 viewBox — an abstract, constellation-style
 * figure (joints as glowing nodes, bones as lines), not a literal
 * illustration. Each node maps to one section of the site.
 */
const NODES: NodeDef[] = [
  { id: "head", x: 100, y: 46, label: "About", blurb: "Who he is, in short.", target: "about" },
  { id: "chest", x: 100, y: 132, label: "Skills", blurb: "What he builds with.", target: "skills" },
  { id: "leftHand", x: 44, y: 158, label: "Projects", blurb: "Things he's shipped.", target: "projects" },
  { id: "rightHand", x: 156, y: 158, label: "GitHub", blurb: "Open source & code.", target: "github" },
  { id: "waist", x: 100, y: 214, label: "Journey", blurb: "How he got here.", target: "journey" },
  { id: "leftFoot", x: 76, y: 372, label: "Achievements", blurb: "Milestones along the way.", target: "achievements" },
  { id: "rightFoot", x: 124, y: 372, label: "Contact", blurb: "Let's talk.", target: "contact" },
];

/** Bone connections between node ids — drawn as glowing lines. */
const BONES: [NodeId, NodeId][] = [
  ["head", "chest"],
  ["chest", "leftHand"],
  ["chest", "rightHand"],
  ["chest", "waist"],
  ["waist", "leftFoot"],
  ["waist", "rightFoot"],
];

const nodeById = (id: NodeId) => NODES.find((n) => n.id === id)!;

export default function ZuiFunMode({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [active, setActive] = useState<NodeDef | null>(null);
  const [hovered, setHovered] = useState<NodeId | null>(null);
  const { play } = useSound();

  useEffect(() => {
    if (!open) setActive(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (active ? setActive(null) : onClose());
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, active, onClose]);

  const go = (node: NodeDef) => {
    onClose();
    setTimeout(() => {
      document.getElementById(node.target)?.scrollIntoView({ behavior: "smooth" });
    }, 350);
  };

  const boneLines = useMemo(
    () =>
      BONES.map(([a, b]) => {
        const na = nodeById(a);
        const nb = nodeById(b);
        return { key: `${a}-${b}`, x1: na.x, y1: na.y, x2: nb.x, y2: nb.y };
      }),
    []
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="zui-stage fixed inset-0 z-[95] flex flex-col items-center justify-center overflow-hidden bg-[#050510]"
          role="dialog"
          aria-label="Explore the portfolio"
        >
          {/* ambient stars, purely decorative */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(1.5px 1.5px at 20% 30%, white, transparent), radial-gradient(1.5px 1.5px at 75% 15%, white, transparent), radial-gradient(1px 1px at 60% 70%, white, transparent), radial-gradient(1px 1px at 30% 85%, white, transparent), radial-gradient(1.5px 1.5px at 88% 60%, white, transparent)",
              backgroundSize: "100% 100%",
            }}
          />

          <button
            onClick={onClose}
            aria-label="Close"
            data-cursor="pointer"
            className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-white/5 p-2.5 text-white/60 backdrop-blur-md transition hover:border-white/30 hover:text-white sm:right-6 sm:top-6"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-2 flex items-center gap-2 text-white/40">
            <Sparkles className="h-3.5 w-3.5" />
            <p className="font-mono text-[11px] uppercase tracking-[0.2em]">Tap a glowing point to explore</p>
          </div>

          <div className="relative w-full max-w-xs px-6 sm:max-w-sm">
            <svg viewBox="0 0 200 400" className="w-full" style={{ overflow: "visible" }}>
              <defs>
                <filter id="zui-glow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* bones */}
              {boneLines.map((b) => (
                <line
                  key={b.key}
                  x1={b.x1}
                  y1={b.y1}
                  x2={b.x2}
                  y2={b.y2}
                  stroke="url(#zui-bone-gradient)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  opacity={0.55}
                />
              ))}
              <defs>
                <linearGradient id="zui-bone-gradient" gradientUnits="userSpaceOnUse" x1="100" y1="46" x2="100" y2="372">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>

              {/* joints / hotspots */}
              {NODES.map((n) => {
                const isHovered = hovered === n.id || active?.id === n.id;
                return (
                  <g key={n.id}>
                    {/* soft outer halo, always animating gently */}
                    <motion.circle
                      cx={n.x}
                      cy={n.y}
                      r={10}
                      fill="#7C3AED"
                      opacity={0.18}
                      animate={{ r: [10, 15, 10], opacity: [0.15, 0.3, 0.15] }}
                      transition={{ repeat: Infinity, duration: 2.4, delay: NODES.indexOf(n) * 0.15 }}
                    />
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={isHovered ? 8 : 6}
                      fill={isHovered ? "#A78BFA" : "#7C3AED"}
                      filter="url(#zui-glow)"
                      style={{ transition: "r 150ms ease, fill 150ms ease" }}
                    />
                    {/* generous invisible tap target */}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={20}
                      fill="transparent"
                      className="cursor-pointer"
                      data-cursor="pointer"
                      onMouseEnter={() => setHovered(n.id)}
                      onMouseLeave={() => setHovered((h) => (h === n.id ? null : h))}
                      onClick={() => {
                        play("click");
                        setActive(n);
                      }}
                      role="button"
                      aria-label={`Open ${n.label}`}
                    />
                    {isHovered && !active && (
                      <text
                        x={n.x}
                        y={n.y - 16}
                        textAnchor="middle"
                        fill="white"
                        fontSize="9"
                        fontFamily="var(--font-mono, monospace)"
                        opacity={0.85}
                      >
                        {n.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="mt-2 font-mono text-[10px] text-white/25">
            An abstract map of the site — every glowing point is a section.
          </p>

          {/* zoomed-in detail card for the active node */}
          <AnimatePresence>
            {active && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 8 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="absolute inset-x-0 bottom-8 z-20 mx-auto w-[calc(100%-2.5rem)] max-w-xs rounded-2xl border border-primary/30 bg-[#0A0F24]/95 p-5 text-center shadow-glow backdrop-blur-xl sm:bottom-12"
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
                  {active.label}
                </p>
                <p className="mt-1.5 font-body text-sm text-white/70">{active.blurb}</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setActive(null)}
                    data-cursor="pointer"
                    className="rounded-full border border-white/15 px-3.5 py-2 font-mono text-[11px] text-white/60 transition hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => go(active)}
                    data-cursor="pointer"
                    className="flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 font-body text-xs font-medium text-white shadow-glow transition hover:brightness-110"
                  >
                    View {active.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
