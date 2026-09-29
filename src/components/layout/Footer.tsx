"use client";

import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

/**
 * The site footer. Deliberately has NO link to /admin/login (nor
 * anywhere else on the public site) — that page is reachable only by
 * typing the URL directly, by request. It's still fully protected by
 * middleware.ts the same as before; this only affects discoverability,
 * not security.
 */
export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
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
