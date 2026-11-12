import { NextResponse } from "next/server";
import { getStoredHero } from "@/lib/firestore-hero";
import { defaultHero } from "@/data/hero";

export const runtime = "nodejs";

/**
 * GET /api/hero — public, no auth.
 * Returns what was saved at /admin/hero, or the built-in defaults when
 * nothing has been saved yet or the database can't be reached (the hero
 * should never render empty).
 */
export async function GET() {
  try {
    const stored = await getStoredHero();
    return NextResponse.json({ hero: stored ?? defaultHero, source: stored ? "firestore" : "default" });
  } catch (err) {
    console.error("[hero] Firestore fetch failed:", err);
    return NextResponse.json({ hero: defaultHero, source: "default" });
  }
}
