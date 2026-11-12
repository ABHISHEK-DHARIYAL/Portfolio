import "server-only";
import type { Analysis, AnalysisResult, Datum, Kpi, Point, Section } from "./analysis-types";

const REVALIDATE = 3600; // refresh analysis at most hourly
const UA = "Mozilla/5.0 (compatible; PortfolioAnalytics/1.0)";

export type PlatformKind = "leetcode" | "codeforces" | "codechef" | "unknown";

export function platformSlug(platform: string): string {
  return platform.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function detectPlatform(platform: string, url: string): PlatformKind {
  const hay = `${platformSlug(platform)} ${url.toLowerCase()}`;
  if (hay.includes("leetcode")) return "leetcode";
  if (hay.includes("codeforces")) return "codeforces";
  if (hay.includes("codechef")) return "codechef";
  return "unknown";
}

/** The profile URL is the source of truth; the admin `handle` is only a fallback. */
export function extractHandle(kind: PlatformKind, url: string, handle: string): string {
  const clean = (s: string) => s.replace(/^@/, "").trim();
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    if (kind === "leetcode") {
      const i = parts.findIndex((p) => p === "u");
      const name = i >= 0 ? parts[i + 1] : parts[0];
      if (name) return clean(name);
    }
    if (kind === "codeforces") {
      const i = parts.findIndex((p) => p === "profile");
      if (i >= 0 && parts[i + 1]) return clean(parts[i + 1]);
    }
    if (kind === "codechef") {
      const i = parts.findIndex((p) => p === "users");
      if (i >= 0 && parts[i + 1]) return clean(parts[i + 1]);
    }
  } catch {
    /* fall through to handle */
  }
  return clean(handle);
}

const fmtDate = (sec: number) =>
  new Date(sec * 1000).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

function longestAndCurrentStreak(daysSet: Set<string>) {
  const sorted = [...daysSet].sort();
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of sorted) {
    const t = Date.parse(`${d}T00:00:00Z`);
    run = prev !== null && t - prev === 86_400_000 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = t;
  }
  // current streak: walk back from today (or yesterday, if today isn't done yet)
  let current = 0;
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  if (!daysSet.has(day.toISOString().slice(0, 10))) day.setUTCDate(day.getUTCDate() - 1);
  while (daysSet.has(day.toISOString().slice(0, 10))) {
    current++;
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return { longest, current };
}

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

/* ============================== LeetCode =============================== */

const LC_QUERY = `
query profile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
    userCalendar { streak totalActiveDays submissionCalendar }
  }
  userContestRanking(username: $username) {
    attendedContestsCount rating globalRanking topPercentage
  }
  userContestRankingHistory(username: $username) {
    attended rating trendDirection contest { title startTime }
  }
}`;

export async function analyzeLeetCode(handle: string, profileUrl: string): Promise<AnalysisResult> {
  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Referer: "https://leetcode.com", "User-Agent": UA },
      body: JSON.stringify({ query: LC_QUERY, variables: { username: handle } }),
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return { ok: false, reason: `LeetCode responded with ${res.status}.` };
    const json = await res.json();
    const d = json?.data;
    if (!d?.matchedUser) return { ok: false, reason: `LeetCode user "${handle}" was not found.` };

    const ac: { difficulty: string; count: number }[] = d.matchedUser.submitStatsGlobal.acSubmissionNum;
    const count = (name: string) => ac.find((x) => x.difficulty === name)?.count ?? 0;
    const easy = count("Easy");
    const medium = count("Medium");
    const hard = count("Hard");
    const total = count("All") || easy + medium + hard;

    const tagGroups = d.matchedUser.tagProblemCounts ?? {};
    const tagMap = new Map<string, number>();
    for (const g of ["fundamental", "intermediate", "advanced"]) {
      for (const t of tagGroups[g] ?? []) tagMap.set(t.tagName, (tagMap.get(t.tagName) ?? 0) + t.problemsSolved);
    }
    const topics: Datum[] = [...tagMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 9)
      .map(([label, value]) => ({ label, value }));

    const cal = d.matchedUser.userCalendar ?? {};
    const rank = d.userContestRanking;
    const history: any[] = (d.userContestRankingHistory ?? []).filter((h: any) => h.attended);
    const ratingPoints: Point[] = history.map((h) => ({
      label: String(h.contest.title).replace("Weekly Contest", "WC").replace("Biweekly Contest", "BWC"),
      value: Math.round(h.rating),
    }));
    const rating = rank ? Math.round(rank.rating) : 0;
    const maxRating = ratingPoints.length ? Math.max(...ratingPoints.map((p) => p.value)) : rating;
    const last = history[history.length - 1];
    const trend = last?.trendDirection === "UP" ? "IMPROVING" : last?.trendDirection === "DOWN" ? "DIPPING" : "STEADY";

    // Deterministic score: same inputs always give the same number.
    const weighted = easy + medium * 2 + hard * 4;
    const volume = clamp(weighted / 1500) * 40;
    const breadth = clamp(topics.filter((t) => t.value >= 20).length / 8) * 25;
    const contests = rank ? clamp((rating - 1200) / 1000) * 20 : 0;
    const streak = clamp((cal.streak ?? 0) / 180) * 15;
    const score = Math.round(volume + breadth + contests + streak);

    const kpis: Kpi[] = [
      { label: "Deterministic DSA Score", value: String(score), suffix: "/ 100", tone: "gold",
        sub: `Volume: ${Math.round(volume)}/40 | Topics: ${Math.round(breadth)}/25 | Contests: ${Math.round(contests)}/20 | Streak: ${Math.round(streak)}/15` },
      { label: "Total Solved", value: String(total), tone: "white", sub: `Easy: ${easy} | Med: ${medium} | Hard: ${hard}` },
      { label: "Contest Rating", value: rank ? String(rating) : "—", tone: "purple",
        sub: rank ? `Max Rating: ${maxRating} | Trend: ${trend} | Top ${rank.topPercentage?.toFixed?.(2) ?? "—"}%` : "No rated contests yet" },
      { label: "Solving Streak", value: String(cal.streak ?? 0), suffix: "Days", tone: "orange",
        sub: `${cal.totalActiveDays ?? 0} active days in the last year` },
    ];

    const sections: Section[] = [
      { type: "donut", title: "Difficulty Distribution", subtitle: "Easy vs Medium vs Hard problem ratio", centerLabel: "solved",
        data: [
          { label: "Easy", value: easy, color: "#10b981" },
          { label: "Medium", value: medium, color: "#f59e0b" },
          { label: "Hard", value: hard, color: "#f43f5e" },
        ] },
    ];
    if (ratingPoints.length > 1) {
      sections.push({ type: "line", title: "Contest Rating Progression", subtitle: "Time-series rating history and performance trend", points: ratingPoints, color: "#a855f7" });
    }
    if (topics.length) {
      sections.push({ type: "bar", title: "Top Topic Breakdown", subtitle: "Solved problem count across primary DSA topics", data: topics, color: "#3b82f6", wide: true });
    }
    sections.push({
      type: "score", title: "How the score is calculated", subtitle: "Fixed formula — no randomness, recomputed from live data",
      total: score,
      parts: [
        { label: "Volume (Easy×1 + Med×2 + Hard×4)", got: Math.round(volume), max: 40 },
        { label: "Topic breadth (topics with 20+ solves)", got: Math.round(breadth), max: 25 },
        { label: "Contest rating (1200 → 2200)", got: Math.round(contests), max: 20 },
        { label: "Streak (180 days = full marks)", got: Math.round(streak), max: 15 },
      ],
    });

    return { ok: true, analysis: { title: "LeetCode", handle, profileUrl, fetchedAt: new Date().toISOString(), kpis, sections, notes: [] } };
  } catch (e) {
    return { ok: false, reason: "Couldn't reach LeetCode right now." };
  }
}

/* ============================== Codeforces ============================= */

async function cf(method: string, qs: string) {
  const res = await fetch(`https://codeforces.com/api/${method}?${qs}`, { next: { revalidate: REVALIDATE } });
  const json = await res.json();
  if (json.status !== "OK") throw new Error(json.comment ?? "Codeforces API error");
  return json.result;
}

export async function analyzeCodeforces(handle: string, profileUrl: string): Promise<AnalysisResult> {
  try {
    const [infoArr, ratingHist, subs] = await Promise.all([
      cf("user.info", `handles=${encodeURIComponent(handle)}`),
      cf("user.rating", `handle=${encodeURIComponent(handle)}`).catch(() => []),
      cf("user.status", `handle=${encodeURIComponent(handle)}`).catch(() => []),
    ]);
    const info = infoArr[0];
    const notes: string[] = [];

    // unique solved problems
    const solved = new Map<string, { rating?: number; tags: string[] }>();
    const verdicts = new Map<string, number>();
    const langs = new Map<string, number>();
    const activeDays = new Set<string>();
    for (const s of subs as any[]) {
      verdicts.set(s.verdict ?? "TESTING", (verdicts.get(s.verdict ?? "TESTING") ?? 0) + 1);
      activeDays.add(new Date(s.creationTimeSeconds * 1000).toISOString().slice(0, 10));
      if (s.verdict === "OK") {
        const key = `${s.problem.contestId ?? s.problem.problemsetName}-${s.problem.index}`;
        if (!solved.has(key)) {
          solved.set(key, { rating: s.problem.rating, tags: s.problem.tags ?? [] });
          langs.set(s.programmingLanguage, (langs.get(s.programmingLanguage) ?? 0) + 1);
        }
      }
    }
    const totalSolved = solved.size;
    const bucket = (lo: number, hi: number) => [...solved.values()].filter((p) => p.rating !== undefined && p.rating >= lo && p.rating < hi).length;
    const unrated = [...solved.values()].filter((p) => p.rating === undefined).length;
    const buckets: Datum[] = [
      { label: "≤ 1000", value: bucket(0, 1100) },
      { label: "1100-1300", value: bucket(1100, 1400) },
      { label: "1400-1600", value: bucket(1400, 1700) },
      { label: "1700-1900", value: bucket(1700, 2000) },
      { label: "2000+", value: bucket(2000, 5000) },
    ].filter((b) => b.value > 0);

    const tagMap = new Map<string, number>();
    for (const p of solved.values()) for (const t of p.tags) tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
    const topics: Datum[] = [...tagMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 9).map(([label, value]) => ({ label, value }));

    const ratingPoints: Point[] = (ratingHist as any[]).map((r) => ({ label: fmtDate(r.ratingUpdateTimeSeconds), value: r.newRating }));
    const bestRank = (ratingHist as any[]).length ? Math.min(...(ratingHist as any[]).map((r) => r.rank)) : null;
    const { longest, current } = longestAndCurrentStreak(activeDays);
    const accepted = verdicts.get("OK") ?? 0;
    const totalSubs = (subs as any[]).length;

    const kpis: Kpi[] = [
      { label: "Current Rating", value: String(info.rating ?? "Unrated"), tone: "cyan", sub: `Rank: ${info.rank ?? "unrated"} | Max: ${info.maxRating ?? "—"} (${info.maxRank ?? "—"})` },
      { label: "Problems Solved", value: String(totalSolved), tone: "green", sub: `${unrated} without a difficulty rating` },
      { label: "Contests", value: String((ratingHist as any[]).length), tone: "purple", sub: bestRank ? `Best rank: #${bestRank}` : "No rated contests yet" },
      { label: "Active Streak", value: String(current), suffix: "Days", tone: "orange", sub: `Longest: ${longest} days | Acceptance: ${totalSubs ? Math.round((accepted / totalSubs) * 100) : 0}%` },
    ];

    const sections: Section[] = [];
    if (buckets.length) sections.push({ type: "donut", title: "Difficulty Distribution", subtitle: "Solved problems by Codeforces problem rating", centerLabel: "solved", data: buckets.map((b, i) => ({ ...b, color: ["#10b981", "#22d3ee", "#f59e0b", "#f97316", "#f43f5e"][i % 5] })) });
    if (ratingPoints.length > 1) sections.push({ type: "line", title: "Contest Rating Progression", subtitle: "Rating after each rated contest", points: ratingPoints, color: "#22d3ee" });
    if (topics.length) sections.push({ type: "bar", title: "Top Tag Breakdown", subtitle: "Solved problems by problem tag", data: topics, color: "#3b82f6", wide: true });
    const verdictData: Datum[] = [...verdicts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label: label.replace(/_/g, " "), value }));
    if (verdictData.length) sections.push({ type: "bar", title: "Submission Verdicts", subtitle: "How your submissions ended", data: verdictData, color: "#f59e0b" });
    const langData: Datum[] = [...langs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value }));
    if (langData.length) sections.push({ type: "bar", title: "Languages", subtitle: "Languages used for solved problems", data: langData, color: "#a855f7" });

    return { ok: true, analysis: { title: "Codeforces", handle, profileUrl, fetchedAt: new Date().toISOString(), kpis, sections, notes } };
  } catch (e: any) {
    return { ok: false, reason: e?.message ? `Codeforces: ${e.message}` : "Couldn't reach Codeforces right now." };
  }
}

/* ============================== CodeChef =============================== */
/*
 * CodeChef has no public API. This scrapes the public profile page, so it is
 * best-effort: if CodeChef changes its markup or blocks the request, the page
 * falls back to a friendly message + a link to the real profile.
 */
export async function analyzeCodeChef(handle: string, profileUrl: string): Promise<AnalysisResult> {
  try {
    const res = await fetch(`https://www.codechef.com/users/${encodeURIComponent(handle)}`, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return { ok: false, reason: `CodeChef responded with ${res.status}.` };
    const html = await res.text();

    const pick = (re: RegExp) => html.match(re)?.[1]?.trim();
    const rating = pick(/rating-number[^>]*>\s*(\d+)/);
    const stars = pick(/rating-star[^>]*>([\s\S]*?)<\/div>/)?.replace(/<[^>]+>/g, "").trim();
    const maxRating = pick(/\(Highest Rating\s*(\d+)\)/i) ?? pick(/Highest Rating[^0-9]*(\d+)/i);
    const globalRank = pick(/global[^<]*rank[\s\S]{0,200}?<strong>\s*(\d+)/i);
    const solvedTotal = pick(/Total Problems Solved:?\s*(\d+)/i);

    let history: Point[] = [];
    const m = html.match(/var\s+all_rating\s*=\s*(\[[\s\S]*?\]);/);
    if (m) {
      try {
        history = (JSON.parse(m[1]) as any[]).map((r) => ({
          label: `${r.getyear}-${String(r.getmonth).padStart(2, "0")}`,
          value: Number(r.rating),
        }));
      } catch { /* ignore */ }
    }

    if (!rating && !history.length && !solvedTotal) {
      return { ok: false, reason: "CodeChef doesn't offer a public API and its page couldn't be read right now." };
    }

    const curRating = rating ? Number(rating) : history[history.length - 1]?.value;
    const peak = maxRating ? Number(maxRating) : history.length ? Math.max(...history.map((h) => h.value)) : undefined;
    const kpis: Kpi[] = [
      { label: "Current Rating", value: String(curRating ?? "—"), tone: "gold", sub: stars ? `Stars: ${stars}` : undefined },
      { label: "Highest Rating", value: String(peak ?? "—"), tone: "purple" },
      { label: "Contests", value: String(history.length || "—"), tone: "cyan" },
      { label: "Problems Solved", value: solvedTotal ?? "—", tone: "green", sub: globalRank ? `Global rank #${globalRank}` : undefined },
    ];
    const sections: Section[] = [];
    if (history.length > 1) sections.push({ type: "line", title: "Contest Rating Progression", subtitle: "Rating after each rated contest", points: history, color: "#f59e0b" });

    return { ok: true, analysis: { title: "CodeChef", handle, profileUrl, fetchedAt: new Date().toISOString(), kpis, sections,
      notes: ["CodeChef has no public API, so this is read from the public profile page and may be partial."] } };
  } catch {
    return { ok: false, reason: "Couldn't reach CodeChef right now." };
  }
}

export async function analyzePlatform(kind: PlatformKind, handle: string, url: string): Promise<AnalysisResult> {
  if (!handle) return { ok: false, reason: "No username could be found for this profile." };
  if (kind === "leetcode") return analyzeLeetCode(handle, url);
  if (kind === "codeforces") return analyzeCodeforces(handle, url);
  if (kind === "codechef") return analyzeCodeChef(handle, url);
  return { ok: false, reason: "Detailed analysis isn't available for this platform yet." };
}
