"use client";

import { ButtonHTMLAttributes, ReactNode, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSound } from "@/components/layout/SoundProvider";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "ghost";
};

let rippleId = 0;

export default function MagneticButton({
  children,
  className,
  variant = "primary",
  onClick,
  onMouseEnter,
  ...props
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const { play } = useSound();

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    ref.current!.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = "translate(0px, 0px)";
  };

  const spawnRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const size = Math.max(rect.width, rect.height) * 1.6;
    const id = rippleId++;
    setRipples((r) => [
      ...r,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top, size },
    ]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
  };

  return (
    <motion.button
      ref={ref}
      data-cursor="pointer"
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onMouseEnter={(e) => {
        play("hover");
        onMouseEnter?.(e);
      }}
      onClick={(e) => {
        play("click");
        spawnRipple(e);
        onClick?.(e);
      }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "relative overflow-hidden rounded-full px-6 py-3 font-body text-sm font-medium transition-shadow duration-300",
        variant === "primary"
          ? "bg-gradient-brand text-white shadow-glow hover:shadow-glow-accent"
          : "border border-white/15 text-white hover:border-primary/60",
        className
      )}
      {...props}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute rounded-full bg-white/30 animate-ping"
          style={{
            left: r.x - r.size / 2,
            top: r.y - r.size / 2,
            width: r.size,
            height: r.size,
            animationDuration: "600ms",
            animationIterationCount: 1,
          }}
        />
      ))}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
