import "server-only";
import type { AnalysisResult, Datum, Kpi, Point, Section } from "./analysis-types";

const REVALIDATE = 3600;

export const GITHUB_USERNAME = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? "ABHISHEK-DHARIYAL";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", CSS: "#a855f7", Kotlin: "#a97bff",
  Python: "#3572a5", HTML: "#e34c26", Java: "#b07219", "C++": "#f34b7d",
};

async function gh(path: string) {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "portfolio-analytics" };
  // Optional: a token lifts the 60 requests/hour unauthenticated limit.
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers, next: { revalidate: REVALIDATE } });
  if (!res.ok) throw new Error(`GitHub responded with ${res.status}`);
  return res.json();
}

/** Contribution heatmap, read from the public contributions fragment (no token needed). */
async function contributionDays(user: string) {
  try {
    const res = await fetch(`https://github.com/users/${user}/contributions`, {
      headers: { "User-Agent": "portfolio-analytics" },
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const tips = new Map<string, number>();
    for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>\s*([^<]*)</g)) {
      const n = m[2].match(/^(\d+)\s+contribution/);
      tips.set(m[1], n ? Number(n[1]) : 0);
    }
    const days: { date: string; count: number; level: number }[] = [];
    for (const m of html.matchAll(/<td[^>]*>/g)) {
      const tag = m[0];
      const date = tag.match(/data-date="([^"]+)"/)?.[1];
      if (!date) continue;
      const id = tag.match(/id="([^"]+)"/)?.[1] ?? "";
      const level = Number(tag.match(/data-level="(\d)"/)?.[1] ?? 0);
      days.push({ date, level, count: tips.get(id) ?? (level > 0 ? level : 0) });
    }
    return days.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export async function analyzeGithub(): Promise<AnalysisResult> {
  const user = GITHUB_USERNAME;
  try {
    const [profile, repos, events, days] = await Promise.all([
      gh(`/users/${user}`),
      gh(`/users/${user}/repos?per_page=100&sort=updated`),
      gh(`/users/${user}/events/public?per_page=100`).catch(() => []),
      contributionDays(user),
    ]);
    const notes: string[] = [];
    const own = (repos as any[]).filter((r) => !r.fork);
    const stars = own.reduce((s, r) => s + r.stargazers_count, 0);
    const forks = own.reduce((s, r) => s + r.forks_count, 0);

    // languages by repo count
    const langMap = new Map<string, number>();
    for (const r of own) if (r.language) langMap.set(r.language, (langMap.get(r.language) ?? 0) + 1);
    const langs: Datum[] = [...langMap.entries()].sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({
      label, value, color: LANG_COLORS[label] ?? ["#64ffda", "#57cbff", "#f472b6", "#facc15", "#fb923c"][i % 5],
    }));

    // repos created per year
    const perYear = new Map<string, number>();
    for (const r of own) {
      const y = String(new Date(r.created_at).getUTCFullYear());
      perYear.set(y, (perYear.get(y) ?? 0) + 1);
    }
    const yearData: Datum[] = [...perYear.entries()].sort().map(([label, value]) => ({ label, value }));

    // recent public events by type (GitHub only exposes ~90 days / 300 events)
    const evTypes = new Map<string, number>();
    const pushPerWeek = new Map<string, number>();
    for (const e of events as any[]) {
      const name = String(e.type).replace(/Event$/, "");
      evTypes.set(name, (evTypes.get(name) ?? 0) + 1);
      if (e.type === "PushEvent") {
        const d = new Date(e.created_at);
        d.setUTCDate(d.getUTCDate() - d.getUTCDay());
        const key = d.toISOString().slice(5, 10);
        pushPerWeek.set(key, (pushPerWeek.get(key) ?? 0) + (e.payload?.size ?? 1));
      }
    }
    const evData: Datum[] = [...evTypes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }));
    const pushPoints: Point[] = [...pushPerWeek.entries()].reverse().map(([label, value]) => ({ label, value }));

    const yearTotal = days.reduce((s, d) => s + d.count, 0);
    const activeDays = days.filter((d) => d.count > 0).length;
    const accountYears = ((Date.now() - Date.parse(profile.created_at)) / 31_557_600_000).toFixed(1);

    const kpis: Kpi[] = [
      { label: "Public Repos", value: String(profile.public_repos), tone: "cyan", sub: `${own.length} original | ${(repos as any[]).length - own.length} forks` },
      { label: "Total Stars", value: String(stars), tone: "gold", sub: `${forks} forks across original repos` },
      { label: "Contributions (1 yr)", value: days.length ? String(yearTotal) : "—", tone: "green", sub: days.length ? `${activeDays} active days` : "Calendar unavailable" },
      { label: "On GitHub", value: accountYears, suffix: "yrs", tone: "purple", sub: `${profile.followers} followers | ${profile.following} following` },
    ];

    const sections: Section[] = [];
    if (days.length) sections.push({ type: "heatmap", title: "Contribution Activity", subtitle: "Daily contributions over the last year", days });
    if (langs.length) sections.push({ type: "donut", title: "Language Mix", subtitle: "Original repos by primary language", centerLabel: "repos", data: langs });
    if (yearData.length) sections.push({ type: "bar", title: "Repos Created per Year", subtitle: "How your building pace has changed", data: yearData, color: "#64ffda" });
    if (pushPoints.length > 1) sections.push({ type: "line", title: "Recent Commit Pace", subtitle: "Commits pushed per week (public events, ~90 days)", points: pushPoints, color: "#57cbff" });
    if (evData.length) sections.push({ type: "bar", title: "Recent Activity Types", subtitle: "What you've been doing lately", data: evData, color: "#f472b6" });

    const recent = own.slice(0, 8).map((r) => ({
      title: r.name, href: r.html_url,
      meta: `${r.language ?? "—"} · ★ ${r.stargazers_count} · updated ${new Date(r.pushed_at ?? r.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      body: r.description ?? undefined,
    }));
    if (recent.length) sections.push({ type: "list", title: "Recently Updated Repositories", subtitle: "Your latest work", items: recent });

    if (!days.length) notes.push("The contribution calendar couldn't be loaded, so that panel is hidden.");
    if (!process.env.GITHUB_TOKEN) notes.push("Using GitHub's public API without a token (rate-limited); results are cached for an hour.");

    return { ok: true, analysis: { title: "GitHub", handle: user, profileUrl: `https://github.com/${user}`, fetchedAt: new Date().toISOString(), kpis, sections, notes } };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? "Couldn't reach GitHub right now." };
  }
}
