"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Github, Star, GitFork, Users, ExternalLink } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

const USERNAME = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? "ABHISHEK-DHARIYAL";
const PROFILE_URL = `https://github.com/${USERNAME}`;

type GhUser = {
  public_repos: number;
  followers: number;
  following: number;
  avatar_url: string;
  bio: string | null;
};

type Repo = {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  html_url: string;
};

type Status = "loading" | "ready" | "error";

export default function GithubSection() {
  const [user, setUser] = useState<GhUser | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`https://api.github.com/users/${USERNAME}`).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("profile fetch failed"))
      ),
      fetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=100`).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("repos fetch failed"))
      ),
    ])
      .then(([userData, repoData]) => {
        if (cancelled) return;
        setUser(userData);
        setRepos(Array.isArray(repoData) ? repoData : []);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Every number below is aggregated from what the API actually returned —
  // nothing here is a placeholder or an invented figure.
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const languageCounts = repos.reduce<Record<string, number>>((acc, r) => {
    if (r.language) acc[r.language] = (acc[r.language] ?? 0) + 1;
    return acc;
  }, {});
  const topLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const topRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);

  return (
    <section id="github" className="relative px-6 py-32">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16 text-center"
        >
          <p className="mb-3 font-mono text-sm text-primary">GitHub</p>
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Live from the API — no placeholder numbers
          </h2>
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noreferrer"
            data-cursor="pointer"
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-sm text-accent hover:underline"
          >
            <Github className="h-4 w-4" /> {PROFILE_URL.replace("https://", "")}
            <ExternalLink className="h-3 w-3" />
          </a>
        </motion.div>

        {status === "loading" && (
          <p className="text-center font-mono text-xs text-white/40">Fetching live GitHub data…</p>
        )}

        {status === "error" && (
          <GlassCard className="mx-auto max-w-md p-6 text-center" glow="#7C3AED">
            <p className="font-body text-sm text-white/60">
              Live GitHub stats couldn&apos;t be fetched right now (rate limits or
              network). Rather than show placeholder numbers, here&apos;s the profile
              directly:
            </p>
            <a
              href={PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 font-mono text-xs text-white"
            >
              <Github className="h-3.5 w-3.5" /> View on GitHub
            </a>
          </GlassCard>
        )}

        {status === "ready" && user && (
          <>
            <div className="mb-8 grid grid-cols-3 gap-4">
              <StatCard icon={Github} value={user.public_repos} label="Public Repos" />
              <StatCard icon={Users} value={user.followers} label="Followers" />
              <StatCard icon={Star} value={totalStars} label="Total Stars" />
            </div>

            {topLanguages.length > 0 && (
              <GlassCard className="mb-8 p-6" glow="#3B82F6">
                <p className="mb-4 font-mono text-xs uppercase tracking-widest text-white/40">
                  Most-used languages across public repos
                </p>
                <div className="space-y-2">
                  {topLanguages.map(([lang, count]) => (
                    <div key={lang} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 font-mono text-xs text-white/60">{lang}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-brand"
                          style={{ width: `${(count / repos.length) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 text-right font-mono text-xs text-white/40">{count}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {topRepos.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {topRepos.map((repo) => (
                  <a key={repo.name} href={repo.html_url} target="_blank" rel="noreferrer" data-cursor="pointer">
                    <GlassCard className="h-full p-5" glow="#22D3EE">
                      <div className="flex items-center gap-2">
                        <Github className="h-4 w-4 text-white/60" />
                        <span className="font-display text-sm font-semibold text-white">
                          {repo.name}
                        </span>
                      </div>
                      {repo.description && (
                        <p className="mt-2 line-clamp-2 font-body text-xs text-white/50">
                          {repo.description}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-4 font-mono text-[11px] text-white/40">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" /> {repo.stargazers_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="h-3 w-3" /> {repo.forks_count}
                        </span>
                        {repo.language && <span>{repo.language}</span>}
                      </div>
                    </GlassCard>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
}) {
  return (
    <GlassCard className="flex flex-col items-center gap-2 p-5 text-center" glow="#7C3AED">
      <Icon className="h-4 w-4 text-primary" />
      <AnimatedCounter value={value} />
      <span className="font-body text-xs text-white/50">{label}</span>
    </GlassCard>
  );
}
