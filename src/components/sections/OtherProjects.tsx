"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Carousel from "@/components/ui/Carousel";

type OtherProject = {
  id: string;
  name: string;
  websiteUrl: string;
  githubUrl: string;
};

/**
 * Fetches from /api/other-projects — Firestore is the only source of
 * truth, no hardcoded data (same strict rule as Achievements). Renders
 * nothing at all when there are zero projects, rather than an empty
 * heading — same pattern used by CodingProfiles.tsx and Achievements.tsx.
 */
export default function OtherProjects() {
  const [projects, setProjects] = useState<OtherProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/other-projects")
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

  if (!loading && projects.length === 0) return null;

  return (
    <section className="relative px-6 pb-32">
      <div className="mx-auto max-w-5xl">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          className="mb-6 font-mono text-sm text-white/40"
        >
          Other projects
        </motion.p>

        <Carousel itemsPerView={{ base: 1, md: 2, lg: 3 }} autoPlay autoPlayInterval={4500}>
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full"
            >
              <GlassCard className="flex h-full items-center justify-between gap-4 p-5" glow="#7C3AED">
                <span className="font-body text-sm text-white/80">{project.name}</span>
                <div className="flex shrink-0 items-center gap-2">
                  {project.websiteUrl && (
                    <a
                      href={project.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="pointer"
                      aria-label={`Visit ${project.name} website`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-primary/50 hover:text-white"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="pointer"
                      aria-label={`View ${project.name} on GitHub`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-primary/50 hover:text-white"
                    >
                      <Github className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
