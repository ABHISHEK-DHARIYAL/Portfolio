import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import type { ContestFormValues } from "./contest-schema";

const COLLECTION = "contests";

export type StoredContest = ContestFormValues & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

/** Shape the public site actually consumes — no admin-only fields. */
export type PublicContest = Omit<StoredContest, "published" | "order" | "createdAt" | "updatedAt">;

function toStoredContest(id: string, data: FirebaseFirestore.DocumentData): StoredContest {
  const createdAt = data.createdAt as Timestamp | undefined;
  const updatedAt = data.updatedAt as Timestamp | undefined;
  return {
    id,
    platform: data.platform,
    handle: data.handle ?? "",
    shortLabel: data.shortLabel ?? "",
    url: data.url,
    order: data.order ?? 0,
    published: data.published ?? true,
    createdAt: (createdAt?.toDate() ?? new Date()).toISOString(),
    updatedAt: (updatedAt?.toDate() ?? new Date()).toISOString(),
  };
}

/** Every contest link, published or not — used by the admin dashboard. */
export async function listAllContests(): Promise<StoredContest[]> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTION).orderBy("order", "asc").get();
  return snapshot.docs.map((doc) => toStoredContest(doc.id, doc.data()));
}

/** Published only, in display order — used by the public site. */
export async function listPublishedContests(): Promise<PublicContest[]> {
  const contests = await listAllContests();
  return contests
    .filter((c) => c.published)
    .map(({ published: _published, order: _order, createdAt: _createdAt, updatedAt: _updatedAt, ...rest }) => rest);
}

export async function createContest(input: ContestFormValues): Promise<string> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).add({
    ...input,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return doc.id;
}

export async function updateContest(id: string, input: Partial<ContestFormValues>): Promise<void> {
  const db = getDb();
  await db
    .collection(COLLECTION)
    .doc(id)
    .update({ ...input, updatedAt: FieldValue.serverTimestamp() });
}

export async function deleteContest(id: string): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTION).doc(id).delete();
}
