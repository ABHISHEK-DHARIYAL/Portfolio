import { NextResponse } from "next/server";
import { listVisibleAchievements } from "@/lib/firestore-achievements";

export const runtime = "nodejs";

/**
 * GET /api/achievements — public, no auth.
 *
 * Serves visible Firestore documents only, newest first. Deliberately NO
 * seed/fallback data here — unlike /api/projects, the
 * project spec for this feature explicitly forbids any hardcoded
 * achievement data ("Firestore must be the source of truth"). An empty
 * collection returns an empty array, and the public section hides
 * itself entirely in that case (see Achievements.tsx) rather than
 * showing a placeholder.
 */
export async function GET() {
  try {
    const achievements = await listVisibleAchievements();
    return NextResponse.json({ achievements });
  } catch (err) {
    console.error("[achievements] Firestore fetch failed:", err);
    // Fail closed to an empty list rather than a 500 — a visitor seeing
    // no Achievements section is a much better failure mode than a
    // broken page over a section that's inherently optional content.
    return NextResponse.json({ achievements: [] });
  }
}
