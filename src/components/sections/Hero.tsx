"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "@/components/layout/ThemeProvider";
import { ArrowRight, ChevronDown, Download, Mail, FolderGit2 } from "lucide-react";
import MagneticButton from "@/components/ui/MagneticButton";

const ROLES = ["Software Engineer", "Full Stack Developer", "AI Enthusiast"];
/**
 * Each question links to where the visitor is taken ("href"), with the
 * button text ("cta"). Change `href` to point anywhere:
 *   "#projects"            → scrolls to that section of the home page
 *                            (ids: about, skills, projects, journey,
 *                            achievements, github, contact)
 *   "/stories"             → another page on this site
 *   "https://example.com"  → an external site (opens in a new tab)
 */
type QAItem = { q: string; a: string; href: string; cta: string };

const QA: QAItem[] = [
  { q: "Why should you hire me?", a: "I turn ideas into products that ship.", href: "#projects", cta: "See my projects" },
  { q: "What can I bring to your team?", a: "Clean code, fast learning, and ownership.", href: "#skills", cta: "See my skills" },
  { q: "What problems do I solve?", a: "I build scalable systems and intelligent platforms.", href: "/stories", cta: "Read the stories behind my projects" },
  { q: "What makes me different?", a: "I blend full-stack skills with an AI mindset.", href: "#about", cta: "More about me" },
  { q: "How do I handle challenges?", a: "I break them down, iterate, and deliver.", href: "#journey", cta: "See my journey" },
  { q: "Where do I add value fast?", a: "From day one: building, debugging, improving.", href: "#achievements", cta: "See my achievements" },
];

/** Types out the answer for the current question, then moves to the next question. */
function useQuestionCycle(items: QAItem[], paused: boolean) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (paused) return; // hold still while the visitor hovers / focuses
    const current = items[index].a;
    const speed = deleting ? 25 : 45;
    const t = setTimeout(() => {
      if (!deleting) {
        if (text.length < current.length) {
          setText(current.slice(0, text.length + 1));
        } else {
          setTimeout(() => setDeleting(true), 1800);
        }
      } else if (text.length > 0) {
        setText(text.slice(0, -1));
      } else {
        setDeleting(false);
        setIndex((i) => (i + 1) % items.length);
      }
    }, speed);
    return () => clearTimeout(t);
  }, [text, deleting, index, items, paused]);

  return { item: items[index], index, text };
}

function QALink({ href, cta }: { href: string; cta: string }) {
  const cls =
    "group inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-xs text-white transition hover:border-primary hover:bg-primary/20";
  const icon = <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />;

  if (href.startsWith("#")) {
    return (
      <button
        type="button"
        className={cls}
        onClick={() => document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" })}
      >
        {cta} {icon}
      </button>
    );
  }
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={cls}>
        {cta} {icon}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {cta} {icon}
    </a>
  );
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
  const [paused, setPaused] = useState(false);
  const { item, index, text: typed } = useQuestionCycle(QA, paused);
  const role = useRoleCycle(ROLES);

  // Explicit, theme-aware colors for the hero text and background, so the
  // words stay readable in both dark and light mode regardless of what is
  // layered behind them.
  const { theme } = useTheme();
  const dark = theme === "dark";
  const c = {
    bg: dark ? "#050816" : "#fcfcff",
    heading: dark ? "#ffffff" : "#0f0d1a",
    role: dark ? "rgba(255,255,255,0.85)" : "rgba(20,18,31,0.85)",
    typed: dark ? "rgba(255,255,255,0.8)" : "rgba(20,18,31,0.75)",
    shadow: dark ? "0 2px 24px rgba(5,8,22,0.9)" : "none",
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ backgroundColor: c.bg }}
    >
      <div className="absolute inset-0 bg-grid-glow" />

      <div
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 font-mono text-sm tracking-widest text-primary"
        >
          Hi, I&apos;m Abhishek Dhariyal
        </motion.p>

        <div className="min-h-[7.5rem] sm:min-h-[11rem]">
          <AnimatePresence mode="wait">
            <motion.h1
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45 }}
              className="font-display text-4xl font-bold sm:text-6xl"
              style={{ color: c.heading, textShadow: c.shadow }}
            >
              {item.q}
            </motion.h1>
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 h-8 font-body text-lg sm:text-xl"
          style={{ color: c.role, textShadow: c.shadow }}
        >
          {role}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 h-6 font-mono text-sm sm:text-base"
          style={{ color: c.typed, textShadow: c.shadow }}
        >
          {typed}
          <span className="ml-0.5 animate-blink">|</span>
        </motion.p>

        <div className="mt-5 h-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <QALink href={item.href} cta={item.cta} />
            </motion.div>
          </AnimatePresence>
        </div>

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
