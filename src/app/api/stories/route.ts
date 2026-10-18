import { NextResponse } from "next/server";
import { listPublishedStories } from "@/lib/firestore-stories";
import { projectStories as seedStories } from "@/data/project-stories";

export const runtime = "nodejs";

/**
 * GET /api/stories — public, no auth.
 *
 * Serves the published stories from Firestore (managed at /admin/stories).
 * If none have been added yet, or Firestore is unreachable, falls back to
 * the bundled entries in src/data/project-stories.ts so the page is never
 * broken. Same approach as /api/projects.
 */
export async function GET() {
  try {
    const stories = await listPublishedStories();
    if (stories.length > 0) {
      return NextResponse.json({ stories, source: "firestore" });
    }
    return NextResponse.json({ stories: seedStories, source: "seed" });
  } catch (err) {
    console.error("[stories] Firestore fetch failed, serving seed data:", err);
    return NextResponse.json({ stories: seedStories, source: "seed" });
  }
}
