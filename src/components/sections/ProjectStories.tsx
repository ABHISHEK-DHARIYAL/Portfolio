"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Lightbulb,
  Target,
  Route,
  Scale,
  Wrench,
  GraduationCap,
  Rocket,
  ExternalLink,
  Github,
} from "lucide-react";
import { projects, type Project } from "@/data/projects";
import { projectStories, type ProjectStory } from "@/data/project-stories";
import GlassCard from "@/components/ui/GlassCard";

const DEFAULT_ACCENT = "#7C3AED";

function isEmpty(s: ProjectStory) {
  return (
    !s.idea &&
    !s.problem &&
    !s.next &&
    s.approach.length === 0 &&
    s.decisions.length === 0 &&
    s.challenges.length === 0 &&
    s.learned.length === 0
  );
}

export default function ProjectStories() {
  const [storyList, setStoryList] = useState<ProjectStory[]>([]);
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState("");

  // Stories come from Firestore (managed at /admin/stories); the bundled
  // entries in src/data/project-stories.ts are only the fallback.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/stories")
        .then((r) => r.json())
        .then((d) => d.stories as ProjectStory[])
        .catch(() => projectStories),
      fetch("/api/projects")
        .then((r) => r.json())
        .then((d) => d.projects as Project[])
        .catch(() => projects),
    ]).then(([st, pr]) => {
      if (cancelled) return;
      const list = st?.length ? st : projectStories;
      setStoryList(list);
      setProjectList(pr?.length ? pr : projects);
      // Deep link: /stories#hourglass opens that story.
      const hash = window.location.hash.replace("#", "");
      setActiveSlug(list.some((x) => x.slug === hash) ? hash : list[0]?.slug ?? "");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const stories = useMemo(
    () =>
      storyList.map((s) => {
        const p = projectList.find((x) => x.slug === s.slug);
        return {
          story: s,
          accent: s.accent || p?.accent || DEFAULT_ACCENT,
          tagline: s.tagline || p?.tagline || "",
          stack: p?.stack ?? [],
          liveUrl: p?.liveUrl || undefined,
          githubUrl: p?.githubUrl || undefined,
        };
      }),
    [storyList, projectList]
  );

  const select = (slug: string) => {
    setActiveSlug(slug);
    window.history.replaceState(null, "", `#${slug}`);
  };

  const current = stories.find((s) => s.story.slug === activeSlug) ?? stories[0];

  return (
    <section className="relative px-6 pb-24 pt-32">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/#projects"
          className="mb-10 inline-flex items-center gap-2 font-mono text-xs text-white/50 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="mb-3 font-mono text-sm text-primary">Project Stories</p>
          <h1 className="font-display text-3xl font-semibold text-white sm:text-5xl">
            Behind every project, a story
          </h1>
          <p className="mt-4 max-w-2xl font-body text-white/60">
            How each idea started, how I approached building it, the decisions
            I made along the way, and what I took away from it.
          </p>
        </motion.div>

        {loading && (
          <p className="text-center font-mono text-xs text-white/40">Loading stories…</p>
        )}

        {/* Project selector */}
        {!loading && (
          <div
            role="tablist"
            aria-label="Choose a project story"
            className="-mx-6 mb-10 flex gap-2 overflow-x-auto px-6 pb-2"
          >
            {stories.map(({ story, accent }) => {
              const on = story.slug === current?.story.slug;
              return (
                <button
                  key={story.slug}
                  role="tab"
                  aria-selected={on}
                  onClick={() => select(story.slug)}
                  className={`shrink-0 rounded-full border px-4 py-2 font-mono text-xs transition ${
                    on
                      ? "border-transparent text-white"
                      : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                  }`}
                  style={on ? { backgroundColor: accent } : undefined}
                >
                  {story.title}
                </button>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!loading && current && (
            <motion.article
              key={current.story.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <StoryView {...current} />
            </motion.article>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function StoryView({
  story,
  accent,
  tagline,
  stack,
  liveUrl,
  githubUrl,
}: {
  story: ProjectStory;
  accent: string;
  tagline: string;
  stack: string[];
  liveUrl?: string;
  githubUrl?: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        {tagline && (
          <p className="font-mono text-xs" style={{ color: accent }}>
            {tagline}
          </p>
        )}
        <h2 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">
          {story.title}
        </h2>
        {stack.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {stack.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] text-white/60"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full px-4 py-2 font-mono text-xs text-white"
              style={{ backgroundColor: accent }}
            >
              <ExternalLink className="h-3.5 w-3.5" /> Live Demo
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 font-mono text-xs text-white/80 hover:border-white/40"
            >
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
          )}
        </div>
      </div>

      {isEmpty(story) && (
        <GlassCard glow={accent} className="p-8 text-center">
          <p className="font-display text-lg text-white">Story coming soon</p>
          <p className="mt-2 font-body text-sm text-white/50">
            The write-up for {story.title} is on its way.
          </p>
        </GlassCard>
      )}

      {story.idea && (
        <Block icon={Lightbulb} label="The spark" sub="How I thought of it" accent={accent}>
          <Prose>{story.idea}</Prose>
        </Block>
      )}

      {story.problem && (
        <Block icon={Target} label="The problem" sub="What I wanted to solve" accent={accent}>
          <Prose>{story.problem}</Prose>
        </Block>
      )}

      {story.approach.length > 0 && (
        <Block icon={Route} label="My approach" sub="How I built it, step by step" accent={accent}>
          <ol className="relative space-y-5 pl-10">
            <span
              aria-hidden
              className="absolute left-[13px] top-1 h-[calc(100%-0.5rem)] w-px bg-white/10"
            />
            {story.approach.map((a, i) => (
              <li key={a.step} className="relative">
                <span
                  className="absolute -left-10 top-0 flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] text-white"
                  style={{ backgroundColor: accent }}
                >
                  {i + 1}
                </span>
                <p className="font-body text-sm font-medium text-white/90">{a.step}</p>
                {a.detail && (
                  <p className="mt-1 font-body text-sm leading-relaxed text-white/55">
                    {a.detail}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Block>
      )}

      {story.decisions.length > 0 && (
        <Block icon={Scale} label="Key decisions" sub="Choices I made, and why" accent={accent}>
          <div className="grid gap-3 sm:grid-cols-2">
            {story.decisions.map((d) => (
              <div key={d.decision} className="rounded-xl border border-white/10 p-4">
                <p className="font-body text-sm font-medium text-white/90">{d.decision}</p>
                <p className="mt-1 font-body text-sm text-white/55">{d.reason}</p>
              </div>
            ))}
          </div>
        </Block>
      )}

      {story.challenges.length > 0 && (
        <Block icon={Wrench} label="Challenges" sub="What went wrong, and how I fixed it" accent={accent}>
          <div className="space-y-3">
            {story.challenges.map((c) => (
              <div key={c.problem} className="rounded-xl border border-white/10 p-4">
                <p className="font-body text-sm font-medium text-white/90">{c.problem}</p>
                <p className="mt-1 font-body text-sm text-white/55">
                  <span className="font-mono text-[11px]" style={{ color: accent }}>
                    FIX →{" "}
                  </span>
                  {c.solution}
                </p>
              </div>
            ))}
          </div>
        </Block>
      )}

      {story.learned.length > 0 && (
        <Block icon={GraduationCap} label="What I learned" accent={accent}>
          <ul className="space-y-2">
            {story.learned.map((l) => (
              <li key={l} className="flex items-start gap-2 font-body text-sm text-white/65">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: accent }}
                />
                {l}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {story.next && (
        <Block icon={Rocket} label="What's next" accent={accent}>
          <Prose>{story.next}</Prose>
        </Block>
      )}
    </div>
  );
}

function Block({
  icon: Icon,
  label,
  sub,
  accent,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  sub?: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard glow={accent} className="p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10"
          style={{ backgroundColor: `${accent}22` }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </span>
        <div>
          <h3 className="font-display text-lg font-semibold text-white">{label}</h3>
          {sub && <p className="font-mono text-[11px] text-white/40">{sub}</p>}
        </div>
      </div>
      {children}
    </GlassCard>
  );
}

function Prose({ children }: { children: string }) {
  return (
    <div className="space-y-3 font-body text-sm leading-relaxed text-white/65 sm:text-base">
      {children.split("\n\n").map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  );
}
