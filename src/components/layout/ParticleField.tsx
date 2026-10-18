"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

type P = { x: number; y: number; vx: number; vy: number; hue: number };

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    // The constellation lines below use fixed, already-saturated brand
    // colors (violet/blue) that read fine against either a dark or light
    // background as-is. The particle DOTS, though, were tuned for a dark
    // background (70% lightness — a light pastel) and would nearly vanish
    // against a light one, so lightness/alpha shift with the theme.
    const dotLightness = theme === "light" ? 40 : 70;
    const dotAlpha = theme === "light" ? 0.7 : 0.55;

    const COUNT = isTouch ? 26 : window.innerWidth < 1024 ? 45 : 80;
    const LINK_DIST = isTouch ? 90 : 130;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let mouse = { x: -9999, y: -9999 };
    let particles: P[] = [];
    let raf = 0;

    const init = () => {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        hue: Math.random() > 0.5 ? 262 : 217, // violet / blue
      }));
    };
    init();

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      init();
    };
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        // drift
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // gentle repulsion from cursor
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 140) {
          const force = (140 - dist) / 140;
          p.x += (dx / (dist || 1)) * force * 1.6;
          p.y += (dy / (dist || 1)) * force * 1.6;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, ${dotLightness}%, ${dotAlpha})`;
        ctx.fill();
      }

      // constellation lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK_DIST) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(124,58,237,${0.12 * (1 - d / LINK_DIST)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        // link near cursor too
        const d = Math.hypot(particles[i].x - mouse.x, particles[i].y - mouse.y);
        if (d < LINK_DIST) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(59,130,246,${0.25 * (1 - d / LINK_DIST)})`;
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-[5] opacity-70"
    />
  );
}
