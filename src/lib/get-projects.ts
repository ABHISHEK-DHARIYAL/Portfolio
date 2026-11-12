import "server-only";
import { listPublishedProjects } from "./firestore-projects";
import { projects as seedProjects } from "@/data/projects";
import type { Project } from "@/data/projects";

/**
 * Published projects for server-rendered pages. Same rule as /api/projects:
 * use what's published in Firestore, and fall back to the bundled defaults in
 * src/data/projects.ts when the collection is empty or can't be reached.
 */
export async function getPublicProjects(): Promise<Project[]> {
  try {
    const projects = await listPublishedProjects();
    if (projects.length > 0) return projects;
  } catch (err) {
    console.error("[projects] Firestore fetch failed, using seed data:", err);
  }
  return seedProjects;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await getPublicProjects();
  return projects.find((p) => p.slug === slug) ?? null;
}
