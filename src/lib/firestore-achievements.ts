import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import type { AchievementFormValues } from "./achievement-schema";
import { uploadPdfToCloudinary, deletePdfFromCloudinary, buildSignedDeliveryUrl } from "./cloudinary";

const COLLECTION = "achievements";

export type StoredAchievement = AchievementFormValues & {
  id: string;
  /** Name of the attached PDF, "" when none. */
  pdfFileName: string;
  /** True when a PDF is attached (regardless of whether it is shown publicly). */
  hasPdf: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Shape the public site consumes — no `visible` (filtering already happened server-side) or timestamps. */
export type PublicAchievement = Omit<
  StoredAchievement,
  "visible" | "createdAt" | "updatedAt" | "pdfVisible" | "pdfFileName" | "hasPdf"
> & {
  /** Stable public URL of the PDF — only present when a PDF is attached AND set visible. */
  pdfUrl: string;
};

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
    pdfVisible: data.pdfVisible ?? true,
    pdfFileName: data.pdfFileName ?? "",
    hasPdf: !!data.pdfPublicId,
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
    .map(
      ({
        visible: _visible,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        pdfVisible,
        pdfFileName: _pdfFileName,
        hasPdf,
        ...rest
      }) => ({
        ...rest,
        pdfUrl: hasPdf && pdfVisible ? `/api/achievements/${rest.id}/pdf` : "",
      })
    );
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
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  const publicId = doc.data()?.pdfPublicId as string | undefined;
  if (publicId) {
    await deletePdfFromCloudinary(publicId).catch((err) =>
      console.error(`[achievements] failed to delete PDF ${publicId}:`, err)
    );
  }
  await ref.delete();
}

const PDF_FOLDER = "resumes/achievements";

/** Uploads (or replaces) the PDF attached to an achievement — same Cloudinary storage as resumes. */
export async function setAchievementPdf(id: string, fileName: string, bytes: Buffer): Promise<void> {
  const db = getDb();
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Achievement not found.");

  const { publicId } = await uploadPdfToCloudinary(bytes, fileName, PDF_FOLDER);
  const oldPublicId = doc.data()?.pdfPublicId as string | undefined;

  await ref.update({
    pdfPublicId: publicId,
    pdfFileName: fileName,
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (oldPublicId) {
    await deletePdfFromCloudinary(oldPublicId).catch((err) =>
      console.error(`[achievements] failed to delete old PDF ${oldPublicId}:`, err)
    );
  }
}

export async function removeAchievementPdf(id: string): Promise<void> {
  const db = getDb();
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return;
  const publicId = doc.data()?.pdfPublicId as string | undefined;
  if (publicId) {
    await deletePdfFromCloudinary(publicId).catch((err) =>
      console.error(`[achievements] failed to delete PDF ${publicId}:`, err)
    );
  }
  await ref.update({
    pdfPublicId: FieldValue.delete(),
    pdfFileName: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/** Signed delivery URL for the PDF — null unless the achievement is visible, has a PDF, and the PDF is set visible. */
export async function getPublicAchievementPdfUrl(id: string): Promise<string | null> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (!data.visible || data.pdfVisible === false || !data.pdfPublicId) return null;
  return buildSignedDeliveryUrl(data.pdfPublicId);
}
