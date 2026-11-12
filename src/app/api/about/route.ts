import { NextResponse } from "next/server";
import { getStoredAbout } from "@/lib/firestore-about";
import { defaultAbout } from "@/data/about";
import { getLiveStatBoxes } from "@/lib/live-stats";

export const runtime = "nodejs";

/**
 * GET /api/about — public, no auth.
 * Returns what was saved at /admin/about (heading, paragraphs, icon links),
 * or the built-in defaults when nothing has been saved yet or the database
 * can't be reached (the About section should never render empty).
 *
 * The four stat boxes are NOT stored: they're fetched live from the
 * LeetCode / CodeChef / Codeforces profiles linked in the icon row
 * (cached ~1 hour), with the built-in numbers as a per-box fallback.
 * Pass ?stats=0 to skip that (the footer only needs the links).
 */
export async function GET(req: Request) {
  let about = defaultAbout;
  let source: "firestore" | "default" = "default";
  try {
    const stored = await getStoredAbout();
    if (stored) {
      about = stored;
      source = "firestore";
    }
  } catch (err) {
    console.error("[about] Firestore fetch failed:", err);
  }

  const wantsStats = new URL(req.url).searchParams.get("stats") !== "0";
  let stats = defaultAbout.stats;
  if (wantsStats) {
    try {
      stats = await getLiveStatBoxes(about.links);
    } catch (err) {
      console.error("[about] live stats failed:", err);
    }
  }

  return NextResponse.json({ about: { ...about, stats }, source });
}
