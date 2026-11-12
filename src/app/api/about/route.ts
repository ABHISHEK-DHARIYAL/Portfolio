import { NextResponse } from "next/server";
import { getStoredAbout } from "@/lib/firestore-about";
import { defaultAbout } from "@/data/about";

export const runtime = "nodejs";

/**
 * GET /api/about — public, no auth.
 * Returns what was saved at /admin/about, or the built-in defaults when
 * nothing has been saved yet or the database can't be reached (the About
 * section should never render empty).
 */
export async function GET() {
  try {
    const stored = await getStoredAbout();
    return NextResponse.json({ about: stored ?? defaultAbout, source: stored ? "firestore" : "default" });
  } catch (err) {
    console.error("[about] Firestore fetch failed:", err);
    return NextResponse.json({ about: defaultAbout, source: "default" });
  }
}
