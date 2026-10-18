"use client";

import { motion } from "framer-motion";
import { GraduationCap, Code2, Wrench, Rocket } from "lucide-react";
import { journeySteps } from "@/data/timeline";
import GlassCard from "@/components/ui/GlassCard";

const ICONS = [GraduationCap, Code2, Code2, Rocket, Rocket, Rocket, Rocket, Rocket, Rocket, Rocket];

export default function Journey() {
  return (
    <section id="journey" className="relative px-6 py-32">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16 text-center"
        >
          <p className="mb-3 font-mono text-sm text-primary">Journey</p>
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            From first line of code to shipped products
          </h2>
        </motion.div>

        <div className="relative">
          <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-primary/60 via-white/10 to-transparent sm:left-6" />
          <div className="space-y-6 pl-12 sm:pl-16">
            {journeySteps.map((step, i) => {
              const Icon = ICONS[i] ?? Wrench;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: Math.min(i * 0.06, 0.4) }}
                  className="relative"
                >
                  <span className="absolute -left-[3.1rem] top-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-brand shadow-glow sm:-left-[4.1rem]">
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </span>
                  <GlassCard className="p-4" glow="#3B82F6">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="font-display text-sm font-semibold text-white">
                        {step.title}
                      </h3>
                      {step.year && (
                        <span className="font-mono text-[11px] text-accent">{step.year}</span>
                      )}
                    </div>
                    {step.description && (
                      <p className="mt-1 font-body text-xs text-white/60">{step.description}</p>
                    )}
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
