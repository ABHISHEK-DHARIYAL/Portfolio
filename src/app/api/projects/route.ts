import { NextResponse } from "next/server";
import { listPublishedProjects } from "@/lib/firestore-projects";
import { projects as seedProjects } from "@/data/projects";

export const runtime = "nodejs";

/**
 * GET /api/projects — public, no auth.
 *
 * Serves whatever's published in Firestore. On a fresh deployment (empty
 * collection) or if Firestore is temporarily unreachable, falls back to
 * the bundled seed data in src/data/projects.ts — the same four projects
 * that shipped before project management existed — so the site is never
 * blank while waiting for the admin to add real content. This is a
 * fallback for *availability*, not fabricated data: the seed content is
 * real project info you already reviewed, just not yet migrated into
 * Firestore. Use "Import defaults" on /admin/projects to migrate it for
 * real, editable, persistent storage.
 */
export async function GET() {
  try {
    const projects = await listPublishedProjects();
    if (projects.length > 0) {
      return NextResponse.json({ projects, source: "firestore" });
    }
    return NextResponse.json({ projects: seedProjects, source: "seed" });
  } catch (err) {
    console.error("[projects] Firestore fetch failed, serving seed data:", err);
    return NextResponse.json({ projects: seedProjects, source: "seed" });
  }
}
