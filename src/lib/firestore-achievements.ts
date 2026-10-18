import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import type { AchievementFormValues } from "./achievement-schema";

const COLLECTION = "achievements";

export type StoredAchievement = AchievementFormValues & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

/** Shape the public site consumes — no `visible` (filtering already happened server-side) or timestamps. */
export type PublicAchievement = Omit<StoredAchievement, "visible" | "createdAt" | "updatedAt">;

function toStoredAchievement(id: string, data: FirebaseFirestore.DocumentData): StoredAchievement {
  const createdAt = data.createdAt as Timestamp | undefined;
  const updatedAt = data.updatedAt as Timestamp | undefined;
  return {
    id,
    title: data.title,
    organization: data.organization ?? "",
    category: data.category,
    metric: data.metric ?? "",
    description: data.description ?? "",
    link: data.link ?? "",
    visible: data.visible ?? false,
    createdAt: (createdAt?.toDate() ?? new Date()).toISOString(),
    updatedAt: (updatedAt?.toDate() ?? new Date()).toISOString(),
  };
}

/** Every achievement, visible or not — used by the admin dashboard. Newest first. */
export async function listAllAchievements(): Promise<StoredAchievement[]> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTION).orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => toStoredAchievement(doc.id, doc.data()));
}

/** Visible only, newest first — used by the public site. */
export async function listVisibleAchievements(): Promise<PublicAchievement[]> {
  const achievements = await listAllAchievements();
  return achievements
    .filter((a) => a.visible)
    .map(({ visible: _visible, createdAt: _createdAt, updatedAt: _updatedAt, ...rest }) => rest);
}

export async function createAchievement(input: AchievementFormValues): Promise<string> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).add({
    ...input,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return doc.id;
}

export async function updateAchievement(
  id: string,
  input: Partial<AchievementFormValues>
): Promise<void> {
  const db = getDb();
  await db
    .collection(COLLECTION)
    .doc(id)
    .update({ ...input, updatedAt: FieldValue.serverTimestamp() });
}

export async function deleteAchievement(id: string): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTION).doc(id).delete();
}
