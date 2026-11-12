"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, BarChart3, ChefHat, Code2, Github, Link2, Linkedin, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { defaultAbout } from "@/data/about";
import type { AboutContent, AboutIcon } from "@/lib/about-schema";

type AboutLink = AboutContent["links"][number];

const LINK_ICONS: Record<AboutIcon, LucideIcon> = {
  github: Github,
  leetcode: Code2,
  codechef: ChefHat,
  codeforces: BarChart3,
  linkedin: Linkedin,
  mail: Mail,
  link: Link2,
};

/**
 * The site footer. Deliberately has NO link to /admin/login (nor
 * anywhere else on the public site) — that page is reachable only by
 * typing the URL directly, by request. It's still fully protected by
 * middleware.ts the same as before; this only affects discoverability,
 * not security.
 *
 * The social icons use the same links as the About section (managed at
 * /admin/about), so editing them there updates both places.
 */
export default function Footer() {
  const [links, setLinks] = useState<AboutLink[]>(defaultAbout.links);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/about?stats=0")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.about?.links)) setLinks(data.about.links);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="relative border-t border-white/10 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 text-center">
        {links.length > 0 && (
          <ul className="flex flex-wrap items-center justify-center gap-3">
            {links.map((l) => {
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

        <motion.span
          whileHover={{ letterSpacing: "0.15em" }}
          className="font-display text-sm font-medium text-white/60"
        >
          Abhishek Dhariyal — crafted with intent.
        </motion.span>

        <p className="font-mono text-xs text-white/30">
          © {new Date().getFullYear()} · Built with Next.js &amp; React Three Fiber
        </p>

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-primary/50 hover:text-white"
        >
          <ArrowUp className="h-4 w-4 transition group-hover:-translate-y-0.5" />
        </button>
      </div>
    </footer>
  );
}
