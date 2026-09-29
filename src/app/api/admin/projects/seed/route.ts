import { NextResponse } from "next/server";
import { projectsCollectionIsEmpty, createProject } from "@/lib/firestore-projects";
import { projects as seedProjects } from "@/data/projects";

export const runtime = "nodejs";

/**
 * POST /api/admin/projects/seed
 *
 * Copies the bundled seed projects (src/data/projects.ts) into Firestore
 * as real, editable documents. Only runs if the projects collection is
 * currently empty — this is a one-time bootstrap action, not something
 * that should silently duplicate data if clicked twice.
 */
export async function POST() {
  try {
    const empty = await projectsCollectionIsEmpty();
    if (!empty) {
      return NextResponse.json(
        { error: "Projects already exist in Firestore — seeding is only for an empty collection." },
        { status: 409 }
      );
    }

    let order = 0;
    for (const project of seedProjects) {
      await createProject({
        slug: project.slug,
        title: project.title,
        tagline: project.tagline,
        description: project.description,
        features: project.features,
        stack: project.stack,
        liveUrl: project.liveUrl ?? "",
        githubUrl: project.githubUrl ?? "",
        accent: project.accent,
        architecture: project.architecture,
        challenges: project.challenges,
        highlights: project.highlights,
        order: order++,
        published: true,
      });
    }

    return NextResponse.json({ ok: true, count: seedProjects.length });
  } catch (err) {
    console.error("[admin/projects/seed] failed:", err);
    return NextResponse.json({ error: "Failed to seed projects." }, { status: 500 });
  }
}
