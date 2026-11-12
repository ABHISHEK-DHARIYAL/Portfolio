"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Github, ExternalLink, ArrowRight } from "lucide-react";
import type { Project } from "@/data/projects";

export default function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [spot, setSpot] = useState({ x: 50, y: 50 });

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
        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8"
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
            background: `linear-gradient(120deg, ${project.accent}, transparent 40%, #57cbff)`,
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        <div className="relative z-10">
          <p className="story-accent-text font-mono text-xs">0{index + 1}</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
            {project.title}
          </h3>
          <p className="mt-1 font-body text-sm text-white/50">{project.tagline}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/projects/${project.slug}`}
              data-cursor="pointer"
              className="group/btn inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-xs text-white transition hover:border-primary hover:bg-primary/20"
            >
              View details
              <ArrowRight className="h-3.5 w-3.5 transition group-hover/btn:translate-x-0.5" />
            </Link>
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
      </div>
    </motion.div>
  );
}
