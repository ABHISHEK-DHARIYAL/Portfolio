"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { platformAbbr, platformColor } from "@/lib/platform-icon";
import ProfileCard from "./ProfileCard";

type Contest = {
  platform: string;
  handle: string;
  url: string;
  shortLabel?: string;
};

// Must match platformSlug() in lib/coding-analytics.ts (that file is server-only).
const slug = (platform: string) => platform.toLowerCase().replace(/[^a-z0-9]/g, "");

export default function CodingProfiles() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/contests")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setContests(data.contests ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Render nothing while loading or when there are no published profiles, so the
  // heading never flashes before disappearing after you delete every entry.
  if (loading || contests.length === 0) return null;

  return (
    <section id="coding-profiles" className="relative px-6 pb-32">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-12 text-center"
        >
          <p className="mb-3 font-mono text-sm text-primary">Coding Profiles</p>
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Where I practice &amp; compete
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-body text-white/60">
            Open a profile&apos;s details for a live breakdown of problems, ratings and consistency.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {contests.map((c, i) => (
            <ProfileCard
              key={`${c.platform}-${c.url}`}
              index={i}
              accent={platformColor(c.platform)}
              badge={platformAbbr(c.platform, c.shortLabel)}
              title={c.platform}
              subtitle={c.handle}
              detailsHref={`/coding-profiles/${slug(c.platform)}`}
              externalHref={c.url}
              externalLabel="Profile"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
