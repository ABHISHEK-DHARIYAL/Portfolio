import { NextResponse } from "next/server";
import { listPublishedContests } from "@/lib/firestore-contests";

export const runtime = "nodejs";

/**
 * GET /api/contests — public, no auth.
 *
 * Serves exactly what's published at /admin/contests — nothing else.
 * There is intentionally NO built-in fallback: if you delete every entry
 * (or hide them all), the "Coding Profiles" section simply disappears from
 * the public site. If the database can't be reached, an empty list is
 * returned for the same reason — a hiccup must never resurrect a link you
 * deliberately removed.
 */
export async function GET() {
  try {
    const contests = await listPublishedContests();
    return NextResponse.json({ contests, source: "firestore" });
  } catch (err) {
    console.error("[contests] Firestore fetch failed:", err);
    return NextResponse.json({ contests: [], source: "unavailable" });
  }
}
