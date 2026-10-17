import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import type { ProjectFormValues } from "./project-schema";

const COLLECTION = "projects";

export type StoredProject = ProjectFormValues & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

/** Shape the public site's ProjectCard/ProjectModal actually consume — no admin-only fields. */
export type PublicProject = Omit<StoredProject, "published" | "order" | "createdAt" | "updatedAt">;

function toStoredProject(id: string, data: FirebaseFirestore.DocumentData): StoredProject {
  const createdAt = data.createdAt as Timestamp | undefined;
  const updatedAt = data.updatedAt as Timestamp | undefined;
  return {
    id,
    slug: data.slug,
    title: data.title,
    tagline: data.tagline ?? "",
    description: data.description ?? "",
    features: data.features ?? [],
    stack: data.stack ?? [],
    liveUrl: data.liveUrl ?? "",
    githubUrl: data.githubUrl ?? "",
    accent: data.accent ?? "#7C3AED",
    architecture: data.architecture ?? [],
    challenges: data.challenges ?? [],
    highlights: data.highlights ?? [],
    order: data.order ?? 0,
    published: data.published ?? true,
    createdAt: (createdAt?.toDate() ?? new Date()).toISOString(),
    updatedAt: (updatedAt?.toDate() ?? new Date()).toISOString(),
  };
}

/** Every project, published or not — used by the admin dashboard. */
export async function listAllProjects(): Promise<StoredProject[]> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTION).orderBy("order", "asc").get();
  return snapshot.docs.map((doc) => toStoredProject(doc.id, doc.data()));
}

/** Published only, in display order — used by the public site. */
export async function listPublishedProjects(): Promise<PublicProject[]> {
  const projects = await listAllProjects();
  return projects
    .filter((p) => p.published)
    .map(({ published: _published, order: _order, createdAt: _createdAt, updatedAt: _updatedAt, ...rest }) => rest);
}

export async function createProject(input: ProjectFormValues): Promise<string> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).add({
    ...input,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return doc.id;
}

export async function updateProject(
  id: string,
  input: Partial<ProjectFormValues>
): Promise<void> {
  const db = getDb();
  await db
    .collection(COLLECTION)
    .doc(id)
    .update({ ...input, updatedAt: FieldValue.serverTimestamp() });
}

export async function deleteProject(id: string): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTION).doc(id).delete();
}

export async function projectsCollectionIsEmpty(): Promise<boolean> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTION).limit(1).get();
  return snapshot.empty;
}
