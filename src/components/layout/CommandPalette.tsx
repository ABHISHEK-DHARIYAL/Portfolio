"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  User,
  Sparkles,
  FolderGit2,
  Briefcase,
  Award,
  Github,
  Mail,
  Download,
} from "lucide-react";

type Command = {
  label: string;
  hint: string;
  icon: React.ElementType;
  action: () => void;
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const goTo = (id: string) => () => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  const commands: Command[] = [
    { label: "Home", hint: "Go to top", icon: Home, action: goTo("hero") },
    { label: "About", hint: "My background", icon: User, action: goTo("about") },
    { label: "Skills", hint: "Tech I work with", icon: Sparkles, action: goTo("skills") },
    { label: "Projects", hint: "Featured work", icon: FolderGit2, action: goTo("projects") },
    { label: "Journey", hint: "How it started", icon: Briefcase, action: goTo("journey") },
    { label: "Achievements", hint: "Milestones along the way", icon: Award, action: goTo("achievements") },
    { label: "GitHub", hint: "Live repo & profile stats", icon: Github, action: goTo("github") },
    { label: "Contact", hint: "Get in touch", icon: Mail, action: goTo("contact") },
    {
      label: "Download Resume",
      hint: "Save my resume as PDF",
      icon: Download,
      action: () => {
        window.open("/api/resume", "_blank");
        setOpen(false);
      },
    },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-start justify-center bg-black/70 backdrop-blur-sm pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="theme-lock-dark w-[90vw] max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F24]/95 shadow-glow"
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="font-mono text-xs text-white/40">⌘K</span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to a section…"
                className="w-full bg-transparent font-body text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-white/40">
                  No matches.
                </p>
              )}
              {filtered.map((c) => (
                <button
                  key={c.label}
                  onClick={c.action}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white/5"
                >
                  <c.icon className="h-4 w-4 text-primary" />
                  <span className="font-body text-sm text-white">{c.label}</span>
                  <span className="ml-auto font-mono text-xs text-white/30">
                    {c.hint}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
