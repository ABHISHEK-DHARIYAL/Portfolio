import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import type { OtherProjectFormValues, OtherProjectUpdateValues } from "./other-project-schema";

const COLLECTION = "other_projects";

export type StoredOtherProject = {
  id: string;
  name: string;
  websiteUrl: string;
  githubUrl: string;
  createdAt: string;
  updatedAt: string;
};

function toStoredOtherProject(id: string, data: FirebaseFirestore.DocumentData): StoredOtherProject {
  const createdAt = data.createdAt as Timestamp | undefined;
  const updatedAt = data.updatedAt as Timestamp | undefined;
  return {
    id,
    name: data.name,
    websiteUrl: data.websiteUrl ?? "",
    githubUrl: data.githubUrl ?? "",
    createdAt: (createdAt?.toDate() ?? new Date()).toISOString(),
    updatedAt: (updatedAt?.toDate() ?? new Date()).toISOString(),
  };
}

/**
 * There's no visibility/published flag on this collection at all (see
 * the project spec — deliberately minimal, no fields beyond name +
 * links). Every document that exists is shown, to both the admin list
 * and the public site — so this one function serves both call sites.
 * Newest first, per spec (no manual ordering field).
 */
export async function listOtherProjects(): Promise<StoredOtherProject[]> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTION).orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => toStoredOtherProject(doc.id, doc.data()));
}

export async function createOtherProject(input: OtherProjectFormValues): Promise<string> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).add({
    name: input.name,
    websiteUrl: input.websiteUrl,
    githubUrl: input.githubUrl,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return doc.id;
}

/**
 * Merges `input` against the existing document and validates that the
 * RESULT still has at least one link before writing — not just that
 * `input` alone does. Needed because a PATCH request might only include
 * `{ websiteUrl: "" }` to clear the website link while leaving
 * `githubUrl` untouched; validating `input` in isolation would wrongly
 * reject that as "no links at all" even though the existing githubUrl
 * is still there and unaffected. Throws if the merged result would
 * leave both links empty — the API route surfaces that as a 400.
 */
export async function updateOtherProject(
  id: string,
  input: OtherProjectUpdateValues
): Promise<void> {
  const db = getDb();
  const ref = db.collection(COLLECTION).doc(id);

  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new Error("Project not found.");
  }
  const current = snapshot.data()!;

  const mergedWebsite = input.websiteUrl ?? current.websiteUrl ?? "";
  const mergedGithub = input.githubUrl ?? current.githubUrl ?? "";
  if (mergedWebsite === "" && mergedGithub === "") {
    throw new Error("Provide at least a website URL or a GitHub URL.");
  }

  await ref.update({ ...input, updatedAt: FieldValue.serverTimestamp() });
}

export async function deleteOtherProject(id: string): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTION).doc(id).delete();
}
