"use client";

import { motion } from "framer-motion";
import { aboutTimeline } from "@/data/timeline";
import GlassCard from "@/components/ui/GlassCard";

export default function About() {
  return (
    <section id="about" className="relative px-6 py-32">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16 text-center"
        >
          <p className="mb-3 font-mono text-sm text-primary">About</p>
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            CSBS student building real systems
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-body text-white/60">
            Studying Computer Science and Business Systems (CSBS) at PDEU,
            with a focus that spans backend systems, full-stack product
            work, applied AI, and system design.
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-primary/60 via-white/10 to-transparent sm:block" />
          <div className="grid gap-6 sm:pl-14">
            {aboutTimeline.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.08 }}
                className="relative"
              >
                <span className="absolute -left-[3.35rem] top-6 hidden h-2.5 w-2.5 rounded-full bg-primary shadow-glow sm:block" />
                <GlassCard className="p-6" glow="#3B82F6">
                  <h3 className="font-display text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-accent">{item.org}</p>
                  <p className="mt-3 font-body text-sm text-white/60">
                    {item.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
