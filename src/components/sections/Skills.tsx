"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Code2, Database, LayoutDashboard, Server, Wrench, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { skillCategories, skills, type Skill } from "@/data/skills";
import GlassCard from "@/components/ui/GlassCard";
import { useTheme } from "@/components/layout/ThemeProvider";

type Category = Skill["category"];
type Filter = "All" | Category;

/**
 * `color` is the vivid brand tone (tints, borders, glows).
 * `ink` is a darker shade of the same hue, used for TEXT in light mode so
 * yellow / cyan labels stay readable on a white background.
 */
const CATEGORY_META: Record<Category, { color: string; ink: string; Icon: LucideIcon }> = {
  Languages: { color: "#7C3AED", ink: "#6D28D9", Icon: Code2 },
  Frontend: { color: "#3B82F6", ink: "#1D4ED8", Icon: LayoutDashboard },
  Backend: { color: "#22D3EE", ink: "#0E7490", Icon: Server },
  Databases: { color: "#F472B6", ink: "#BE185D", Icon: Database },
  Tools: { color: "#FACC15", ink: "#A16207", Icon: Wrench },
};

const ABBR: Record<string, string> = {
  Java: "Jv",
  "C++": "C++",
  JavaScript: "JS",
  TypeScript: "TS",
  React: "Re",
  "Next.js": "Nx",
  "Tailwind CSS": "Tw",
  "Node.js": "Nd",
  "Express.js": "Ex",
  "REST APIs": "API",
  MySQL: "SQL",
  MongoDB: "Mg",
  Firebase: "Fb",
  Git: "Git",
  GitHub: "GH",
  "VS Code": "VS",
  Postman: "Pm",
};

function SkillCard({ skill, isLight }: { skill: Skill; isLight: boolean }) {
  const { color, ink, Icon } = CATEGORY_META[skill.category];
  const labelColor = isLight ? ink : color;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <GlassCard className="h-full p-5" glow={color}>
        {/* colored top edge */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}00)` }}
        />

        <div className="flex items-start gap-4">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-mono text-sm font-semibold"
            style={{
              color: labelColor,
              borderColor: `${color}55`,
              background: `linear-gradient(135deg, ${color}26, ${color}0d)`,
            }}
          >
            {ABBR[skill.name] ?? skill.name.slice(0, 2)}
          </span>

          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-white">{skill.name}</h3>
            <p
              className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest"
              style={{ color: labelColor }}
            >
              <Icon className="h-3 w-3" aria-hidden />
              {skill.category}
            </p>
          </div>
        </div>

        <p className="mt-4 font-body text-sm leading-relaxed text-white/60">{skill.description}</p>

        {skill.usedIn.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-4">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-white/40">
              Used in
            </span>
            {skill.usedIn.map((p) => (
              <span
                key={p}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-white/70"
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

export default function Skills() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [filter, setFilter] = useState<Filter>("All");

  const visible = useMemo(
    () => (filter === "All" ? skills : skills.filter((s) => s.category === filter)),
    [filter]
  );

  const tabs: { id: Filter; count: number; color: string; ink: string; Icon: LucideIcon }[] = [
    { id: "All", count: skills.length, color: "#7C3AED", ink: "#6D28D9", Icon: Layers },
    ...skillCategories.map((cat) => ({
      id: cat as Filter,
      count: skills.filter((s) => s.category === cat).length,
      ...CATEGORY_META[cat],
    })),
  ];

  return (
    <section id="skills" className="relative overflow-hidden px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-12 text-center"
        >
          <p className="mb-3 font-mono text-sm text-primary">Skills</p>
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            The tools I build with
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-body text-white/60">
            {skills.length} technologies across {skillCategories.length} areas. Filter by category
            to see what each one is used for and which projects it powers.
          </p>
        </motion.div>

        {/* category filter */}
        <div
          role="tablist"
          aria-label="Filter skills by category"
          className="mb-10 flex flex-wrap justify-center gap-2.5"
        >
          {tabs.map((t) => {
            const active = filter === t.id;
            const textColor = isLight ? t.ink : t.color;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(t.id)}
                data-cursor="pointer"
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs transition-all duration-200 ${
                  active ? "font-semibold" : "text-white/60 hover:text-white"
                }`}
                style={
                  active
                    ? {
                        color: textColor,
                        borderColor: `${t.color}88`,
                        background: `${t.color}1f`,
                        boxShadow: `0 6px 18px -8px ${t.color}99`,
                      }
                    : { borderColor: "rgba(128,128,150,0.28)" }
                }
              >
                <t.Icon className="h-3.5 w-3.5" aria-hidden />
                {t.id}
                <span
                  className="rounded-full px-1.5 py-px text-[10px]"
                  style={{
                    background: active ? `${t.color}33` : "rgba(128,128,150,0.16)",
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((skill) => (
              <SkillCard key={skill.name} skill={skill} isLight={isLight} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
