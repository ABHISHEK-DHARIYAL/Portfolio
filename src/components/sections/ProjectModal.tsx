"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ExternalLink, Github, Gauge, GitCommitHorizontal } from "lucide-react";
import type { Project } from "@/data/projects";

export default function ProjectModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  // Rendered into <body> (not in place): the page wrapper in PageShell animates
  // with transform/filter, which turns it into the containing block for any
  // `position: fixed` descendant — so an in-place modal was centered on the
  // whole page instead of the viewport and ended up off-screen.
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[92] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 20, scale: 0.96, filter: "blur(6px)" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="theme-lock-dark max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0A0F24]/95 p-6 shadow-glow sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs" style={{ color: project.accent }}>
                  {project.tagline}
                </p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">
                  {project.title}
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close project details"
                className="rounded-full border border-white/10 p-2 text-white/50 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {project.description && (
              <p className="mt-4 font-body text-sm leading-relaxed text-white/60">
                {project.description}
              </p>
            )}

            {project.highlights.length > 0 && (
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {project.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2">
                    <Gauge className="h-3.5 w-3.5 shrink-0" style={{ color: project.accent }} />
                    <span className="font-body text-xs text-white/70">{h}</span>
                  </div>
                ))}
              </div>
            )}

            {project.architecture.length > 0 && (
              <Section title="Architecture overview">
                <ul className="space-y-2">
                  {project.architecture.map((a) => (
                    <li key={a} className="flex items-start gap-2 font-body text-xs text-white/60">
                      <GitCommitHorizontal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
                      {a}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {project.challenges.length > 0 && (
              <Section title="Challenges & solutions">
                <div className="space-y-3">
                  {project.challenges.map((c) => (
                    <div key={c.problem} className="rounded-xl border border-white/10 p-3">
                      <p className="font-body text-xs font-medium text-white/80">{c.problem}</p>
                      <p className="mt-1 font-body text-xs text-white/50">{c.solution}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {project.stack.length > 0 && (
              <Section title="Tech stack">
                <div className="flex flex-wrap gap-2">
                  {project.stack.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] text-white/60"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 font-mono text-xs text-white"
                  style={{ backgroundColor: project.accent }}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Live Demo
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 font-mono text-xs text-white/80 hover:border-white/40"
                >
                  <Github className="h-3.5 w-3.5" /> GitHub
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-white/40">{title}</p>
      {children}
    </div>
  );
}
