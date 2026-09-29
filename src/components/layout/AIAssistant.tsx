"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Bot, ChevronRight, Download, RotateCcw, Send, X } from "lucide-react";
import {
  STARTERS,
  achievementsReply,
  answer,
  profilesReply,
  type ChatAction,
  type ChatReply,
} from "@/lib/chat-engine";

type Msg = {
  id: number;
  from: "bot" | "user";
  text: string;
  actions?: ChatAction[];
  followUps?: string[];
};

const STORAGE_KEY = "portfolio-chat-v2";
const MAX_INPUT = 300;

const INTRO: Msg = {
  id: 0,
  from: "bot",
  text: "Hi! 👋 I'm the **Portfolio Guide**. Ask me about Abhishek's projects, skills, journey, or how to get in touch — or tap a suggestion below.",
  followUps: STARTERS,
};

/* ------------------------------ rich text ------------------------------- */

const INLINE = /(\*\*[^*]+\*\*|https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.-]+)/g;

function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(INLINE).map((part, i) => {
        if (!part) return null;
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (/^https?:\/\//.test(part)) {
          return (
            <a key={i} href={part} target="_blank" rel="noreferrer noopener" className="text-primary underline underline-offset-2">
              {part.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
          );
        }
        if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(part)) {
          return (
            <a key={i} href={`mailto:${part}`} className="text-primary underline underline-offset-2">
              {part}
            </a>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/** Tiny, safe markdown subset: paragraphs, "- " bullets, **bold**, links. */
function RichText({ text }: { text: string }) {
  const blocks: { list: boolean; lines: string[] }[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const isItem = /^\s*[-•]\s+/.test(line);
    const last = blocks[blocks.length - 1];
    const clean = isItem ? line.replace(/^\s*[-•]\s+/, "") : line;
    if (last && last.list === isItem && isItem) last.lines.push(clean);
    else blocks.push({ list: isItem, lines: [clean] });
  }
  return (
    <div className="space-y-2">
      {blocks.map((b, i) =>
        b.list ? (
          <ul key={i} className="space-y-1">
            {b.lines.map((l, j) => (
              <li key={j} className="flex gap-2">
                <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>
                  <Inline text={l} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <Inline text={b.lines.join(" ")} />
          </p>
        )
      )}
    </div>
  );
}

/* ------------------------------ component -------------------------------- */

export default function AIAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([INTRO]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const checkedAi = useRef(false);

  /* restore this tab's conversation */
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Msg[];
      if (Array.isArray(parsed) && parsed.length) {
        setMessages(parsed);
        idRef.current = Math.max(...parsed.map((m) => m.id)) + 1;
      }
    } catch {
      /* storage unavailable or corrupt — start fresh */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  /* find out (once) whether the optional AI mode is configured */
  useEffect(() => {
    if (!open || checkedAi.current) return;
    checkedAi.current = true;
    fetch("/api/chat")
      .then((r) => (r.ok ? r.json() : { ai: false }))
      .then((j) => setAiEnabled(Boolean(j.ai)))
      .catch(() => setAiEnabled(false));
  }, [open]);

  /* focus on open, Esc to close */
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  /* keep the newest message in view — scroll the panel, never the page */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  const push = useCallback((reply: ChatReply) => {
    setMessages((m) => [
      ...m,
      { id: idRef.current++, from: "bot", text: reply.text, actions: reply.actions, followUps: reply.followUps },
    ]);
  }, []);

  const ask = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_INPUT);
      if (!text || typing) return;

      const userMsg: Msg = { id: idRef.current++, from: "user", text };
      setMessages((m) => [...m, { ...userMsg }]);
      setInput("");
      setTyping(true);

      const started = Date.now();
      const local = answer(text);
      let reply: ChatReply = local;

      try {
        if (local.live) {
          const url = local.live === "achievements" ? "/api/achievements" : "/api/contests";
          const data = await fetch(url).then((r) => r.json()).catch(() => null);
          const live =
            local.live === "achievements"
              ? achievementsReply(data?.achievements ?? null)
              : profilesReply(data?.contests ?? null);
          reply = { ...live, actions: live.actions ?? local.actions, followUps: local.followUps };
        } else if (!local.confident && aiEnabled) {
          const history = [...messages, userMsg]
            .filter((m) => m.id !== 0)
            .slice(-6)
            .map((m) => ({ role: m.from === "user" ? ("user" as const) : ("assistant" as const), content: m.text }))
            .filter((m) => m.content.trim());
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ messages: history }),
          });
          if (res.ok) {
            const data = (await res.json()) as { reply?: string };
            if (data.reply) {
              reply = {
                text: data.reply,
                actions: local.actions,
                followUps: ["What projects has he built?", "How do I contact him?"],
                confident: true,
              };
            }
          }
          // any failure quietly falls back to the local answer
        }
      } catch {
        /* fall back to the local reply */
      }

      // A short, length-aware pause so replies feel conversational, not instant.
      const minDelay = Math.min(900, 350 + reply.text.length * 2);
      const wait = Math.max(0, minDelay - (Date.now() - started));
      setTimeout(() => {
        push(reply);
        setTyping(false);
      }, wait);
    },
    [aiEnabled, messages, push, typing]
  );

  const reset = () => {
    setMessages([INTRO]);
    idRef.current = 1;
    setTyping(false);
    setInput("");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    inputRef.current?.focus();
  };

  const runAction = (a: ChatAction) => {
    if (a.kind === "scroll") {
      document.getElementById(a.target)?.scrollIntoView({ behavior: "smooth" });
      if (window.innerWidth < 640) onClose(); // the panel would cover the section on phones
    } else if (a.kind === "resume") {
      window.open("/api/resume", "_blank", "noopener");
    } else if (a.href.startsWith("mailto:")) {
      window.location.href = a.href;
    } else {
      window.open(a.href, "_blank", "noopener,noreferrer");
    }
  };

  const lastBotId = [...messages].reverse().find((m) => m.from === "bot")?.id;
  const conversationStarted = messages.length > 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          role="dialog"
          aria-label="Portfolio assistant"
          className="theme-lock-dark fixed bottom-[10rem] right-4 z-[85] flex h-[min(32rem,calc(100dvh-12rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F24]/95 shadow-glow backdrop-blur-xl sm:right-6 sm:w-[24rem] sm:max-w-none"
        >
          {/* header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand">
                  <Bot className="h-[18px] w-[18px] text-white" />
                </div>
                <span
                  aria-hidden
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0A0F24] bg-emerald-400"
                />
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-white">Portfolio Guide</p>
                <p className="font-mono text-[10px] text-white/50">
                  {aiEnabled ? "AI-assisted · from this portfolio" : "Instant answers · from this portfolio"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {conversationStarted && (
                <button
                  onClick={reset}
                  aria-label="Start a new conversation"
                  title="New conversation"
                  className="rounded-full p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close assistant"
                className="rounded-full p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* conversation */}
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={m.from === "user" ? "flex justify-end" : "flex flex-col items-start"}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 font-body text-[13px] leading-relaxed ${
                    m.from === "bot"
                      ? "rounded-tl-md bg-white/[0.06] text-white/80"
                      : "rounded-tr-md bg-gradient-brand text-white"
                  }`}
                >
                  {m.from === "bot" ? <RichText text={m.text} /> : m.text}
                </div>

                {m.from === "bot" && m.actions && m.actions.length > 0 && (
                  <div className="mt-2 flex max-w-[92%] flex-wrap gap-1.5">
                    {m.actions.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => runAction(a)}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-medium text-primary transition hover:bg-primary/20"
                      >
                        {a.kind === "resume" ? (
                          <Download className="h-3 w-3" />
                        ) : a.kind === "link" ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* contextual follow-ups only under the latest bot message */}
                {m.from === "bot" && m.id === lastBotId && !typing && m.followUps && m.followUps.length > 0 && (
                  <div className="mt-2.5 flex max-w-[95%] flex-wrap gap-1.5">
                    {m.followUps.map((s) => (
                      <button
                        key={s}
                        onClick={() => ask(s)}
                        className="rounded-full border border-white/15 px-2.5 py-1 text-left font-mono text-[10px] text-white/60 transition hover:border-primary/50 hover:text-white"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}

            {typing && (
              <div
                className="flex w-fit items-center gap-1 rounded-2xl rounded-tl-md bg-white/[0.06] px-3.5 py-3"
                aria-label="Assistant is typing"
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-white/50"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2 border-t border-white/10 p-3"
          >
            <input
              ref={inputRef}
              value={input}
              maxLength={MAX_INPUT}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about projects, skills, contact…"
              aria-label="Your question"
              autoComplete="off"
              className="flex-1 rounded-full bg-white/[0.05] px-4 py-2.5 font-body text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim() || typing}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-white transition disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
