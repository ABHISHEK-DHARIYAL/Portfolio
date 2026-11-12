"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, ChefHat, Code2, Github, Link2, Linkedin, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { defaultAbout } from "@/data/about";
import type { AboutContent, AboutIcon } from "@/lib/about-schema";

const LINK_ICONS: Record<AboutIcon, LucideIcon> = {
  github: Github,
  leetcode: Code2,
  codechef: ChefHat,
  codeforces: BarChart3,
  linkedin: Linkedin,
  mail: Mail,
  link: Link2,
};

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

/**
 * Text on the left, stat boxes on the right. Below the `lg` breakpoint
 * (tablets / phones) the boxes drop underneath the text. Content comes
 * from /admin/about; the built-in defaults show until it loads.
 */
export default function About() {
  const [about, setAbout] = useState<AboutContent>(defaultAbout);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/about")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.about) setAbout(data.about);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="about" className="relative px-6 py-32">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-14">
        {/* Left: text + profile links */}
        <motion.div {...fade}>
          <p className="mb-3 font-mono text-sm text-primary">About</p>
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">{about.heading}</h2>
          <div className="mt-5 space-y-3 font-body text-white/60">
            {about.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {about.links.length > 0 && (
            <ul className="mt-7 flex flex-wrap items-center gap-3">
              {about.links.map((l) => {
                const Icon = LINK_ICONS[l.icon] ?? Link2;
                return (
                  <li key={`${l.label}-${l.href}`}>
                    <motion.a
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      aria-label={l.label}
                      title={l.label}
                      data-cursor="pointer"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.94 }}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 backdrop-blur-md transition-colors hover:border-primary/60 hover:text-primary"
                    >
                      <Icon className="h-5 w-5" />
                    </motion.a>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>

        {/* Right (below on phones): stat boxes */}
        {about.stats.length > 0 && (
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
            {about.stats.map((s, i) => (
              <motion.div key={`${s.label}-${i}`} {...fade} transition={{ delay: i * 0.07 }}>
                <GlassCard className="h-full p-5" glow="#64ffda">
                  <p className="font-display text-3xl font-semibold text-primary">{s.value}</p>
                  <p className="mt-1 font-body text-sm font-medium text-white">{s.label}</p>
                  {s.detail && (
                    <p className="mt-2 font-mono text-[11px] leading-relaxed text-white/50">{s.detail}</p>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
