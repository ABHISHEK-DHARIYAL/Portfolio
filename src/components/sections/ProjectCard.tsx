"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Github, ExternalLink, ChevronRight } from "lucide-react";
import type { Project } from "@/data/projects";

export default function ProjectCard({
  project,
  index,
  onOpenDetails,
}: {
  project: Project;
  index: number;
  onOpenDetails: (p: Project) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [spot, setSpot] = useState({ x: 50, y: 50 });
  const [expanded, setExpanded] = useState(false);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ ry: (px - 0.5) * 14, rx: -(py - 0.5) * 14 });
    setSpot({ x: px * 100, y: py * 100 });
  };

  const reset = () => setTilt({ rx: 0, ry: 0 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: index * 0.1 }}
      style={{ perspective: 1200 }}
    >
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: "transform 0.25s ease",
        }}
        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(420px circle at ${spot.x}% ${spot.y}%, ${project.accent}22, transparent 65%)`,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            padding: 1,
            background: `linear-gradient(120deg, ${project.accent}, transparent 40%, #3B82F6)`,
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <p className="font-mono text-xs" style={{ color: project.accent }}>
              0{index + 1}
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
              {project.title}
            </h3>
            <p className="mt-1 font-body text-sm text-white/50">{project.tagline}</p>
            {project.description && (
              <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-white/60">
                {project.description}
              </p>
            )}

            <div className="mt-4 flex items-center gap-4">
              {project.features.length > 0 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  data-cursor="pointer"
                  className="flex items-center gap-1 font-mono text-xs text-white/50 transition hover:text-white"
                >
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
                  />
                  {expanded ? "Hide features" : "Features"}
                </button>
              )}
              <button
                onClick={() => onOpenDetails(project)}
                data-cursor="pointer"
                className="font-mono text-xs text-white/50 underline decoration-white/20 underline-offset-4 transition hover:text-white"
              >
                Read More
              </button>
            </div>

            {expanded && project.features.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                {project.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 font-body text-xs text-white/60"
                  >
                    <span
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: project.accent }}
                    />
                    {f}
                  </li>
                ))}
              </motion.ul>
            )}

            {project.stack.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {project.stack.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] text-white/60 transition group-hover:border-white/20"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="pointer"
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 font-mono text-xs text-white transition"
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
                  data-cursor="pointer"
                  className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 font-mono text-xs text-white/80 transition hover:border-white/40"
                >
                  <Github className="h-3.5 w-3.5" /> GitHub
                </a>
              )}
            </div>
          </div>

          {/* status readout — derived only from real data, no invented commits */}
          <div className="w-full max-w-xs shrink-0 rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-white/50 lg:w-72">
            <div className="mb-2 flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400/70" />
              <span className="h-2 w-2 rounded-full bg-yellow-400/70" />
              <span className="h-2 w-2 rounded-full bg-green-400/70" />
            </div>
            <p className="text-white/70">{project.title}</p>
            <p className="mt-2">
              $ status:{" "}
              <span style={{ color: project.accent }}>
                {project.liveUrl ? "live" : "in development"}
              </span>
            </p>
            {project.githubUrl && <p className="mt-1 text-white/30">$ source: public on GitHub</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
