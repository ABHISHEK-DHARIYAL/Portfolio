"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TerminalSquare, X } from "lucide-react";
import { projects } from "@/data/projects";
import { skills } from "@/data/skills";
import { journeySteps } from "@/data/timeline";

type Line = { type: "input" | "output"; text: string };

const COMMANDS = [
  "help",
  "about",
  "skills",
  "projects",
  "journey",
  "github",
  "contact",
  "resume",
  "clear",
  "whoami",
];

function runCommand(raw: string): string[] {
  const cmd = raw.trim().toLowerCase();

  switch (cmd) {
    case "help":
      return [
        "Available commands:",
        ...COMMANDS.map((c) => `  ${c}`),
        "Tip: press Tab to autocomplete, up/down to browse history.",
      ];
    case "about":
      return [
        "Abhishek Dhariyal — B.Tech, Computer Science and Business Systems (CSBS), PDEU (2024–2028).",
        "Focused on backend systems, full-stack products, applied AI, and system design.",
      ];
    case "skills":
      return [
        "Skill set:",
        ...Array.from(new Set(skills.map((s) => s.category))).map(
          (cat) => `  ${cat}: ${skills.filter((s) => s.category === cat).map((s) => s.name).join(", ")}`
        ),
      ];
    case "projects":
      return [
        "Featured projects:",
        ...projects.map((p) => `  ${p.title} — ${p.tagline}`),
        "Scrolling to the projects section…",
      ];
    case "journey":
      return ["Journey:", ...journeySteps.map((s) => `  ${s.year ? s.year + " — " : ""}${s.title}`)];
    case "github":
      return ["Opening GitHub profile…", "-> https://github.com/ABHISHEK-DHARIYAL"];
    case "contact":
      return ["Scroll to the Contact section, or email dhariyalabhi@gmail.com"];
    case "resume":
      return ["Opening resume in a new tab…"];
    case "whoami":
      return ["guest@abhishek-portfolio: visitor with good taste"];
    case "clear":
      return ["__CLEAR__"];
    case "":
      return [];
    default:
      return [`command not found: ${cmd} — type 'help' for a list of commands`];
  }
}

export default function Terminal({ onClose }: { onClose: () => void }) {
  const [lines, setLines] = useState<Line[]>([
    { type: "output", text: "Welcome. Type 'help' to get started." },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (value: string) => {
    const result = runCommand(value);
    setHistory((h) => [...h, value]);
    setHistoryIndex(-1);

    if (result[0] === "__CLEAR__") {
      setLines([]);
      return;
    }

    setLines((l) => [
      ...l,
      { type: "input", text: value },
      ...result.map((r) => ({ type: "output" as const, text: r })),
    ]);

    const c = value.trim().toLowerCase();
    if (c === "resume") window.open("/api/resume", "_blank");
    if (c === "contact") document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    if (c === "projects") document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
    if (c === "journey") document.getElementById("journey")?.scrollIntoView({ behavior: "smooth" });
    if (c === "github") window.open("https://github.com/ABHISHEK-DHARIYAL", "_blank");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submit(input);
      setInput("");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const match = COMMANDS.find((c) => c.startsWith(input.toLowerCase()));
      if (match) setInput(match);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const idx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(idx);
      setInput(history[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const idx = historyIndex + 1;
      if (idx >= history.length) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        setHistoryIndex(idx);
        setInput(history[idx]);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      role="dialog"
      aria-label="Interactive terminal"
      className="theme-lock-dark fixed bottom-4 right-4 z-[85] w-[92vw] max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-black/85 shadow-glow backdrop-blur-xl sm:bottom-24"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
          <span className="ml-2 flex items-center gap-1.5 font-mono text-xs text-white/40">
            <TerminalSquare className="h-3.5 w-3.5" /> guest@abhishek-portfolio
          </span>
        </div>
        <button onClick={onClose} aria-label="Close terminal" className="text-white/40 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        className="h-64 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((l, i) => (
          <div key={i} className={l.type === "input" ? "text-white" : "text-white/50"}>
            {l.type === "input" ? <span className="text-primary">$ </span> : null}
            {l.text}
          </div>
        ))}
        <div className="flex items-center text-white">
          <span className="text-primary">$ </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            aria-label="Terminal input"
            className="ml-1 flex-1 bg-transparent outline-none"
          />
          <span className="ml-0.5 h-3.5 w-1.5 animate-blink bg-white" />
        </div>
        <div ref={bottomRef} />
      </div>
    </motion.div>
  );
}
