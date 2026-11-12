"use client";

import { motion } from "framer-motion";
import { BarChart3, ChefHat, Code2, GraduationCap, Github, Linkedin, Mail, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  aboutEducation,
  aboutFocus,
  aboutHeading,
  aboutIntro,
  aboutLinks,
  aboutProjects,
  aboutStats,
  type AboutLink,
} from "@/data/about";
import GlassCard from "@/components/ui/GlassCard";

const LINK_ICONS: Record<AboutLink["icon"], LucideIcon> = {
  github: Github,
  leetcode: Code2,
  codechef: ChefHat,
  codeforces: BarChart3,
  linkedin: Linkedin,
  mail: Mail,
};

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export default function About() {
  return (
    <section id="about" className="relative px-6 py-32">
      <div className="mx-auto max-w-5xl">
        {/* Intro */}
        <motion.div {...fade} className="mb-12 text-center">
          <p className="mb-3 font-mono text-sm text-primary">About</p>
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">{aboutHeading}</h2>
          <div className="mx-auto mt-5 max-w-2xl space-y-3 font-body text-white/60">
            {aboutIntro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          {/* Profile links */}
          <ul className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {aboutLinks.map((l) => {
              const Icon = LINK_ICONS[l.icon];
              return (
                <li key={l.label}>
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
        </motion.div>

        {/* Competitive programming stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {aboutStats.map((s, i) => (
            <motion.div key={s.label} {...fade} transition={{ delay: i * 0.07 }}>
              <GlassCard className="h-full p-5" glow="#64ffda">
                <p className="font-display text-3xl font-semibold text-primary">{s.value}</p>
                <p className="mt-1 font-body text-sm font-medium text-white">{s.label}</p>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-white/50">{s.detail}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Projects */}
        <motion.h3 {...fade} className="mb-5 mt-16 font-display text-xl font-semibold text-white">
          Projects I&apos;ve built
        </motion.h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {aboutProjects.map((p, i) => (
            <motion.a
              key={p.name}
              {...fade}
              transition={{ delay: i * 0.07 }}
              href={p.href}
              target="_blank"
              rel="noreferrer"
              data-cursor="pointer"
              className="block"
            >
              <GlassCard className="h-full p-5" glow="#57cbff">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-display text-lg font-semibold text-white">{p.name}</h4>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-white/50 transition group-hover:text-primary" />
                </div>
                <p className="mt-1 font-mono text-xs text-accent">{p.language}</p>
                <p className="mt-3 font-body text-sm text-white/60">{p.description}</p>
              </GlassCard>
            </motion.a>
          ))}
        </div>

        {/* Education */}
        <motion.div {...fade} className="mt-16">
          <GlassCard className="p-6" glow="#57cbff">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">{aboutEducation.degree}</h3>
                <p className="mt-1 font-mono text-xs text-accent">{aboutEducation.school}</p>
                <p className="mt-3 font-body text-sm text-white/60">{aboutEducation.description}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Focus areas */}
        <motion.ul {...fade} className="mt-8 flex flex-wrap justify-center gap-2">
          {aboutFocus.map((f) => (
            <li
              key={f}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-xs text-white/60"
            >
              {f}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
