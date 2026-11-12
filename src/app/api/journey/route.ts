import { NextResponse } from "next/server";
import { getStoredJourney } from "@/lib/firestore-journey";
import { defaultJourney } from "@/data/timeline";

export const runtime = "nodejs";

/**
 * GET /api/journey — public, no auth.
 * Returns what was saved at /admin/journey, or the built-in defaults when
 * nothing has been saved yet or the database can't be reached (the Journey
 * section should never render empty).
 */
export async function GET() {
  try {
    const stored = await getStoredJourney();
    return NextResponse.json({ journey: stored ?? defaultJourney, source: stored ? "firestore" : "default" });
  } catch (err) {
    console.error("[journey] Firestore fetch failed:", err);
    return NextResponse.json({ journey: defaultJourney, source: "default" });
  }
}
