"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, ExternalLink, FileBadge2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Carousel from "@/components/ui/Carousel";

type Achievement = {
  id: string;
  title: string;
  organization: string;
  category: string;
  metric: string;
  description: string;
  link: string;
};

/**
 * Fetches from /api/achievements — Firestore is the only source of
 * truth, no hardcoded data. Renders nothing at all when there are zero
 * visible achievements — same pattern CodingProfiles.tsx uses.
 *
 * Only `title` and `category` are guaranteed present. `organization`,
 * `metric`, `description`, and `link` are all optional and rendered
 * conditionally — an achievement with just a title/category still
 * renders a complete-looking card, never an empty section or a
 * placeholder like "Organization: —".
 */
export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/achievements")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setAchievements(data.achievements ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && achievements.length === 0) return null;

  return (
    <section id="achievements" className="relative px-6 py-32">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16 text-center"
        >
          <p className="mb-3 font-mono text-sm text-primary">Achievements</p>
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Milestones along the way
          </h2>
        </motion.div>

        <Carousel itemsPerView={{ base: 1, md: 2, lg: 3 }} autoPlay autoPlayInterval={5000}>
          {achievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              className="h-full"
            >
              <GlassCard className="flex h-full flex-col p-5" glow="#7C3AED">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-brand">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-sm font-semibold text-white">
                      {achievement.title}
                    </h3>
                    {/* Organization + category on one line when org is present;
                        just the category badge below when it isn't. */}
                    {achievement.organization && (
                      <p className="mt-0.5 font-mono text-xs text-accent">
                        {achievement.organization}
                      </p>
                    )}
                  </div>
                </div>

                {achievement.metric && (
                  <p className="mt-3 font-body text-sm font-medium text-white/90">
                    {achievement.metric}
                  </p>
                )}

                {achievement.description && (
                  <p className="mt-2 font-body text-sm leading-relaxed text-white/60">
                    {achievement.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-white/50">
                    {achievement.category}
                  </span>
                  {achievement.link && (
                    <a
                      href={achievement.link}
                      target="_blank"
                      rel="noreferrer"
                      data-cursor="pointer"
                      className="ml-auto flex items-center gap-1 font-mono text-[11px] text-accent hover:underline"
                    >
                      {achievement.category === "Certification" ? (
                        <>
                          <FileBadge2 className="h-3 w-3" /> View certificate
                        </>
                      ) : (
                        <>
                          View <ExternalLink className="h-3 w-3" />
                        </>
                      )}
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
