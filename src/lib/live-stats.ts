import "server-only";
import { defaultAbout } from "@/data/about";
import { detectPlatform, extractHandle } from "./coding-analytics";
import type { AboutContent } from "./about-schema";

type Stat = AboutContent["stats"][number];

const REVALIDATE = 3600; // re-fetch from the platforms at most hourly
const TIMEOUT_MS = 6000; // never let a slow site hang the About section
const UA = "Mozilla/5.0 (compatible; PortfolioAnalytics/1.0)";

const fmt = (n: number) => n.toLocaleString("en-US");
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** The profile URL for a platform, taken from the About section's icon links. */
function profile(links: AboutContent["links"], icon: "leetcode" | "codechef" | "codeforces") {
  const url = links.find((l) => l.icon === icon)?.href;
  if (!url) return null;
  const kind = detectPlatform(icon, url);
  const handle = extractHandle(kind, url, "");
  return handle ? { handle } : null;
}

/* -------------------------------- LeetCode ------------------------------ */

const LC_QUERY = `
query stats($username: String!) {
  matchedUser(username: $username) {
    submitStatsGlobal { acSubmissionNum { difficulty count } }
  }
  userContestRanking(username: $username) {
    attendedContestsCount rating topPercentage badge { name }
  }
}`;

async function leetcode(handle: string): Promise<{ rating?: Stat; solved?: number }> {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com", "User-Agent": UA },
    body: JSON.stringify({ query: LC_QUERY, variables: { username: handle } }),
    next: { revalidate: REVALIDATE },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`LeetCode ${res.status}`);
  const d = (await res.json())?.data;
  if (!d?.matchedUser) throw new Error("LeetCode user not found");

  const out: { rating?: Stat; solved?: number } = {};

  const rank = d.userContestRanking;
  if (rank?.rating) {
    const parts = [
      rank.badge?.name,
      rank.topPercentage != null ? `top ${Number(rank.topPercentage).toFixed(1)}% globally` : null,
      rank.attendedContestsCount != null ? `${rank.attendedContestsCount} contests` : null,
    ].filter(Boolean);
    out.rating = { value: fmt(Math.round(rank.rating)), label: "LeetCode contest rating", detail: parts.join(" · ") };
  }

  const ac: { difficulty: string; count: number }[] = d.matchedUser.submitStatsGlobal?.acSubmissionNum ?? [];
  const n = (name: string) => ac.find((x) => x.difficulty === name)?.count ?? 0;
  const total = n("All") || n("Easy") + n("Medium") + n("Hard");
  if (total > 0) out.solved = total;
  return out;
}

/* ------------------------------- Codeforces ----------------------------- */

async function codeforces(handle: string): Promise<Stat | undefined> {
  const res = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`, {
    next: { revalidate: REVALIDATE },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = await res.json();
  if (json.status !== "OK") throw new Error("Codeforces API error");
  const u = json.result?.[0];
  if (!u?.rating) return undefined;
  const parts = [u.rank ? cap(String(u.rank)) : null, u.maxRating ? `max ${u.maxRating}` : null].filter(Boolean);
  return { value: String(u.rating), label: "Codeforces rating", detail: parts.join(" · ") };
}

/** Distinct problems with at least one accepted submission. */
async function codeforcesSolved(handle: string): Promise<number | undefined> {
  const res = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`, {
    next: { revalidate: REVALIDATE },
    signal: AbortSignal.timeout(TIMEOUT_MS * 2),
  });
  const json = await res.json();
  if (json.status !== "OK") throw new Error("Codeforces API error");
  const solved = new Set<string>();
  for (const s of json.result as any[]) {
    if (s.verdict === "OK") solved.add(`${s.problem.contestId ?? s.problem.problemsetName}-${s.problem.index}`);
  }
  return solved.size;
}

/* -------------------------------- CodeChef ------------------------------ */
// No public API — best-effort read of the public profile page.

async function codechef(handle: string): Promise<{ stat?: Stat; solved?: number }> {
  const res = await fetch(`https://www.codechef.com/users/${encodeURIComponent(handle)}`, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    next: { revalidate: REVALIDATE },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`CodeChef ${res.status}`);
  const html = await res.text();
  const pick = (re: RegExp) => html.match(re)?.[1]?.trim();

  const solvedText = pick(/Total Problems Solved:?\s*(\d+)/i) ?? pick(/Problems Solved[^0-9<]{0,40}(\d+)/i);
  const solved = solvedText ? Number(solvedText) : undefined;

  const rating = pick(/rating-number[^>]*>\s*(\d+)/);
  if (!rating) return { solved };
  const starText = pick(/rating-star[^>]*>([\s\S]*?)<\/div>/)?.replace(/<[^>]+>/g, "").trim();
  const starCount = (starText?.match(/★/g) ?? []).length;
  const stars = starCount ? `${starCount}★` : starText || null;
  const max = pick(/\(Highest Rating\s*(\d+)\)/i) ?? pick(/Highest Rating[^0-9]*(\d+)/i);
  const globalRank = pick(/global[^<]*rank[\s\S]{0,200}?<strong>\s*(\d+)/i);

  const parts = [stars, max ? `highest ${max}` : null, globalRank ? `global rank ${globalRank}` : null].filter(Boolean);
  return { stat: { value: rating, label: "CodeChef rating", detail: parts.join(" · ") }, solved };
}

/**
 * The four About stat boxes, in a fixed order. Each one is filled from the
 * live platform when possible; if that platform can't be reached (or the
 * profile link is missing) the built-in text for that box is used instead,
 * so nothing ever renders blank.
 *
 * Box 2 is the combined total of problems solved across LeetCode,
 * Codeforces and CodeChef. If one platform can't be read, the total covers
 * the ones that could, and the detail line says which is unavailable.
 */
export async function getLiveStatBoxes(links: AboutContent["links"]): Promise<Stat[]> {
  const fallback = defaultAbout.stats;
  const lc = profile(links, "leetcode");
  const cc = profile(links, "codechef");
  const cf = profile(links, "codeforces");

  const [lcRes, ccRes, cfRes, cfSolvedRes] = await Promise.allSettled([
    lc ? leetcode(lc.handle) : Promise.resolve({} as { rating?: Stat; solved?: number }),
    cc ? codechef(cc.handle) : Promise.resolve({} as { stat?: Stat; solved?: number }),
    cf ? codeforces(cf.handle) : Promise.resolve(undefined),
    cf ? codeforcesSolved(cf.handle) : Promise.resolve(undefined),
  ]);

  const lcv = lcRes.status === "fulfilled" ? lcRes.value : {};
  const ccv = ccRes.status === "fulfilled" ? ccRes.value : {};
  const cfv = cfRes.status === "fulfilled" ? cfRes.value : undefined;
  const cfSolved = cfSolvedRes.status === "fulfilled" ? cfSolvedRes.value : undefined;

  const counts = [
    { name: "LeetCode", n: (lcv as { solved?: number }).solved },
    { name: "Codeforces", n: cfSolved },
    { name: "CodeChef", n: (ccv as { solved?: number }).solved },
  ];
  const known = counts.filter((c) => typeof c.n === "number" && c.n > 0);
  const combined: Stat =
    known.length === 0
      ? fallback[1]
      : {
          value: fmt(known.reduce((sum, c) => sum + (c.n as number), 0)),
          label: "Coding problems solved",
          detail: counts
            .map((c) => (typeof c.n === "number" && c.n > 0 ? `${c.name} ${c.n}` : `${c.name} n/a`))
            .join(" · "),
        };

  return [
    (lcv as { rating?: Stat }).rating ?? fallback[0],
    combined,
    (ccv as { stat?: Stat }).stat ?? fallback[2],
    cfv ?? fallback[3],
  ];
}
