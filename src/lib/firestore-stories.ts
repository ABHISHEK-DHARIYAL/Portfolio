import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import type { StoryFormValues } from "./story-schema";

const COLLECTION = "projectStories";

export type StoredStory = StoryFormValues & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

/** What the public /stories page consumes — no admin-only fields. */
export type PublicStory = Omit<StoredStory, "id" | "published" | "order" | "createdAt" | "updatedAt">;

function toStoredStory(id: string, data: FirebaseFirestore.DocumentData): StoredStory {
  const createdAt = data.createdAt as Timestamp | undefined;
  const updatedAt = data.updatedAt as Timestamp | undefined;
  return {
    id,
    slug: data.slug,
    title: data.title,
    tagline: data.tagline ?? "",
    accent: data.accent ?? "",
    idea: data.idea ?? "",
    problem: data.problem ?? "",
    approach: data.approach ?? [],
    decisions: data.decisions ?? [],
    challenges: data.challenges ?? [],
    learned: data.learned ?? [],
    next: data.next ?? "",
    order: data.order ?? 0,
    published: data.published ?? true,
    createdAt: (createdAt?.toDate() ?? new Date()).toISOString(),
    updatedAt: (updatedAt?.toDate() ?? new Date()).toISOString(),
  };
}

/** Every story, published or not — used by the admin dashboard. */
export async function listAllStories(): Promise<StoredStory[]> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTION).orderBy("order", "asc").get();
  return snapshot.docs.map((doc) => toStoredStory(doc.id, doc.data()));
}

/** Published only, in display order — used by the public site. */
export async function listPublishedStories(): Promise<PublicStory[]> {
  const stories = await listAllStories();
  return stories
    .filter((s) => s.published)
    .map(({ id: _id, published: _p, order: _o, createdAt: _c, updatedAt: _u, ...rest }) => rest);
}

export async function createStory(input: StoryFormValues): Promise<string> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).add({
    ...input,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return doc.id;
}

export async function updateStory(id: string, input: Partial<StoryFormValues>): Promise<void> {
  const db = getDb();
  await db
    .collection(COLLECTION)
    .doc(id)
    .update({ ...input, updatedAt: FieldValue.serverTimestamp() });
}

export async function deleteStory(id: string): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTION).doc(id).delete();
}
