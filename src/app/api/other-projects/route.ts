import { NextResponse } from "next/server";
import { listOtherProjects } from "@/lib/firestore-other-projects";

export const runtime = "nodejs";

/**
 * GET /api/other-projects — public, no auth.
 *
 * Serves every document in `other_projects`, newest first. No
 * visibility flag exists on this collection (see the spec — it's
 * deliberately minimal), so every document that exists is shown. No
 * seed/fallback data either — same strict "Firestore is the only
 * source of truth" rule as /api/achievements, stricter than
 * /api/projects (which does fall back to bundled
 * content on a brand-new deployment).
 */
export async function GET() {
  try {
    const projects = await listOtherProjects();
    return NextResponse.json({ projects });
  } catch (err) {
    console.error("[other-projects] Firestore fetch failed:", err);
    // Fail closed to an empty list rather than a 500 — a visitor seeing
    // no Other Projects section is a much better failure mode than a
    // broken page over inherently optional content.
    return NextResponse.json({ projects: [] });
  }
}
