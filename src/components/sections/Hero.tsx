"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Download, Mail, FolderGit2 } from "lucide-react";
import MagneticButton from "@/components/ui/MagneticButton";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
});

const ROLES = ["Software Engineer", "Full Stack Developer", "AI Enthusiast"];
const LINES = [
  "Building scalable systems.",
  "Designing intelligent platforms.",
  "Turning ideas into products.",
];

function useTypewriter(lines: string[]) {
  const [lineIndex, setLineIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = lines[lineIndex];
    const speed = deleting ? 30 : 55;
    const t = setTimeout(() => {
      if (!deleting) {
        if (text.length < current.length) {
          setText(current.slice(0, text.length + 1));
        } else {
          setTimeout(() => setDeleting(true), 1200);
        }
      } else {
        if (text.length > 0) {
          setText(text.slice(0, -1));
        } else {
          setDeleting(false);
          setLineIndex((i) => (i + 1) % lines.length);
        }
      }
    }, speed);
    return () => clearTimeout(t);
  }, [text, deleting, lineIndex, lines]);

  return text;
}

function useRoleCycle(roles: string[]) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % roles.length), 2200);
    return () => clearInterval(t);
  }, [roles.length]);
  return roles[i];
}

export default function Hero() {
  const typed = useTypewriter(LINES);
  const role = useRoleCycle(ROLES);

  return (
    <section
      id="hero"
      // No longer locked to a permanent dark palette (see HeroScene.tsx's
      // doc comment) — the 3D scene now adapts its own background/colors
      // to the site theme, so Hero's text can safely follow the theme
      // too, the same as every other section.
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base"
    >
      <div className="absolute inset-0 bg-grid-glow" />
      <HeroScene />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 font-mono text-sm tracking-widest text-primary"
        >
          Hi, I&apos;m
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="font-display text-5xl font-bold text-white sm:text-7xl"
        >
          Abhishek Dhariyal
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 h-8 font-body text-lg text-white/70 sm:text-xl"
        >
          {role}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 h-6 font-mono text-sm text-white/50 sm:text-base"
        >
          {typed}
          <span className="ml-0.5 animate-blink">|</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <MagneticButton
            onClick={() =>
              document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span className="flex items-center gap-2">
              <FolderGit2 className="h-4 w-4" /> View Projects
            </span>
          </MagneticButton>
          <MagneticButton
            variant="ghost"
            onClick={() => window.open("/api/resume", "_blank")}
          >
            <span className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Download Resume
            </span>
          </MagneticButton>
          <MagneticButton
            variant="ghost"
            onClick={() =>
              document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Contact Me
            </span>
          </MagneticButton>
        </motion.div>
      </div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 text-white/40"
      >
        <ChevronDown className="h-6 w-6" />
      </motion.div>
    </section>
  );
}
