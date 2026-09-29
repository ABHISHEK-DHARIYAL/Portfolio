"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Project } from "@/data/projects";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";
import Carousel from "@/components/ui/Carousel";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Project | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setProjects(data.projects ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="projects" className="relative px-6 py-32">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16 text-center"
        >
          <p className="mb-3 font-mono text-sm text-primary">Selected Work</p>
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Products, not just prototypes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-body text-white/60">
            Full-stack builds — each shipped with real authentication, real
            data, and a real reason to exist.
          </p>
        </motion.div>

        {loading && (
          <p className="text-center font-mono text-xs text-white/40">Loading projects…</p>
        )}

        <Carousel itemsPerView={{ base: 1, md: 1, lg: 2 }} autoPlay autoPlayInterval={6000} gap={32}>
          {projects.map((p, i) => (
            <div key={p.slug} className="h-full">
              <ProjectCard project={p} index={i} onOpenDetails={setActive} />
            </div>
          ))}
        </Carousel>
      </div>

      <ProjectModal project={active} onClose={() => setActive(null)} />
    </section>
  );
}
