"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useSound } from "./SoundProvider";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#7C3AED", "#3B82F6", "#22D3EE", "#F472B6", "#FACC15"];
    const pieces = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      size: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      spin: (Math.random() - 0.5) * 10,
    }));

    let raf = 0;
    let frame = 0;
    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (frame < 150) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[98]" />;
}

export default function EasterEggs() {
  const [matrix, setMatrix] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const buffer = useRef<string[]>([]);
  const { play } = useSound();

  useEffect(() => {
    // hidden developer console message
    console.log(
      "%cLooking for something? Try the Konami code. ↑↑↓↓←→←→ba",
      "color:#7C3AED;font-size:13px;font-weight:600;"
    );
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      buffer.current = [...buffer.current, e.key].slice(-KONAMI.length);
      if (buffer.current.join(",") === KONAMI.join(",")) {
        setMatrix((m) => !m);
        setConfetti(true);
        setToast("Achievement unlocked: Konami Master");
        play("achievement");
        setTimeout(() => setConfetti(false), 2600);
        setTimeout(() => setToast(null), 3200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {matrix && <MatrixRain />}
      {confetti && <ConfettiBurst />}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="theme-lock-dark fixed left-1/2 top-6 z-[99] flex items-center gap-2 rounded-full border border-white/10 bg-[#0A0F24]/95 px-4 py-2.5 shadow-glow"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs text-white">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "01アビシェークダリヤル<>{}/=+*";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    let raf = 0;
    const draw = () => {
      ctx.fillStyle = "rgba(5,8,22,0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#22c55e";
      ctx.font = `${fontSize}px monospace`;
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, y * fontSize);
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[6] opacity-60"
    />
  );
}
