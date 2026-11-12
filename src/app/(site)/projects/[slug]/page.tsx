import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Gauge,
  GitCommitHorizontal,
  Github,
} from "lucide-react";
import Footer from "@/components/layout/Footer";
import { getProjectBySlug } from "@/lib/get-projects";

// Project content comes from the admin (Firestore); refresh it every minute.
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found — Abhishek Dhariyal" };
  return {
    title: `${project.title} — Abhishek Dhariyal`,
    description: project.description || project.tagline || undefined,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const hasDetails =
    Boolean(project.description) ||
    project.highlights.length > 0 ||
    project.features.length > 0 ||
    project.architecture.length > 0 ||
    project.challenges.length > 0 ||
    project.stack.length > 0;

  return (
    <main id="main-content" className="relative">
      <article className="relative px-6 pb-24 pt-32">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/#projects"
            className="inline-flex items-center gap-2 font-mono text-xs text-white/50 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All projects
          </Link>

          <header className="mt-8">
            {project.tagline && (
              <p className="story-accent-text font-mono text-xs">{project.tagline}</p>
            )}
            <h1 className="mt-2 font-display text-4xl font-semibold text-white sm:text-5xl">
              {project.title}
            </h1>
            {project.description && (
              <p className="mt-5 font-body leading-relaxed text-white/60">{project.description}</p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="pointer"
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 font-mono text-xs text-white transition"
                  style={{ backgroundColor: project.accent }}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Live Demo
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="pointer"
                  className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 font-mono text-xs text-white/80 transition hover:border-white/40"
                >
                  <Github className="h-3.5 w-3.5" /> GitHub
                </a>
              )}
              <Link
                href={`/stories#${project.slug}`}
                data-cursor="pointer"
                className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 font-mono text-xs text-white/80 transition hover:border-white/40"
              >
                <BookOpen className="h-3.5 w-3.5" /> Read the story
              </Link>
            </div>
          </header>

          {project.highlights.length > 0 && (
            <div className="mt-10 grid gap-2 sm:grid-cols-2">
              {project.highlights.map((h) => (
                <div
                  key={h}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <Gauge className="story-accent-text h-3.5 w-3.5 shrink-0" />
                  <span className="font-body text-xs text-white/70">{h}</span>
                </div>
              ))}
            </div>
          )}

          {project.features.length > 0 && (
            <Section title="Features">
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {project.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 font-body text-sm text-white/60">
                    <span
                      className="mt-2 h-1 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: project.accent }}
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {project.architecture.length > 0 && (
            <Section title="Architecture overview">
              <ul className="space-y-2">
                {project.architecture.map((a) => (
                  <li key={a} className="flex items-start gap-2 font-body text-sm text-white/60">
                    <GitCommitHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
                    {a}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {project.challenges.length > 0 && (
            <Section title="Challenges & solutions">
              <div className="space-y-3">
                {project.challenges.map((c) => (
                  <div
                    key={c.problem}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="font-body text-sm font-medium text-white/80">{c.problem}</p>
                    <p className="mt-1 font-body text-sm text-white/50">{c.solution}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {project.stack.length > 0 && (
            <Section title="Tech stack">
              <div className="flex flex-wrap gap-2">
                {project.stack.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] text-white/60"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {!hasDetails && (
            <p className="mt-12 rounded-xl border border-white/10 bg-white/[0.03] p-4 font-body text-sm text-white/50">
              Full details for this project are coming soon.
            </p>
          )}
        </div>
      </article>
      <Footer />
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-white/40">{title}</h2>
      {children}
    </section>
  );
}
