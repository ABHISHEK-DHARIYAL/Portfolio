import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import { uploadPdfToCloudinary, deletePdfFromCloudinary, buildSignedDeliveryUrl } from "./cloudinary";

const COLLECTION = "resumes";

export type StoredResume = {
  id: string;
  fileName: string;
  publicId: string;
  secureUrl: string;
  active: boolean;
  uploadedAt: string;
};

/**
 * secureUrl is ALWAYS recomputed here from the stored publicId via
 * buildSignedDeliveryUrl(), rather than trusting whatever raw string is
 * sitting in the Firestore document. Two reasons:
 *
 * 1. Fixes show_original_customer_untrusted for resumes uploaded BEFORE
 *    the signed-URL fix existed — their stored secureUrl is the old,
 *    unsigned, now-401ing one, but publicId is still valid, so
 *    regenerating a fresh signed URL from it works with no re-upload
 *    needed.
 * 2. Keeps the delivery URL correct even if Cloudinary's URL structure
 *    or the signing scheme ever changes — publicId is the stable,
 *    durable identifier; the URL built from it is a derived value, not
 *    something that should be trusted as a frozen snapshot from
 *    upload time.
 *
 * (The Firestore document still has its own secureUrl field, written at
 * upload time — see uploadAndActivateResume() below — matching the
 * documented schema. It's just never read back out; this function's
 * computed value always wins.)
 */
function toStoredResume(id: string, data: FirebaseFirestore.DocumentData): StoredResume {
  const uploadedAt = data.uploadedAt as Timestamp | undefined;
  return {
    id,
    fileName: data.fileName,
    publicId: data.publicId,
    secureUrl: buildSignedDeliveryUrl(data.publicId),
    active: data.active ?? false,
    uploadedAt: (uploadedAt?.toDate() ?? new Date()).toISOString(),
  };
}

export async function listResumes(): Promise<StoredResume[]> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTION).orderBy("uploadedAt", "desc").get();
  return snapshot.docs.map((doc) => toStoredResume(doc.id, doc.data()));
}

export async function getResumeById(id: string): Promise<StoredResume | null> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return toStoredResume(doc.id, doc.data()!);
}

export async function getActiveResume(): Promise<StoredResume | null> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTION).where("active", "==", true).limit(1).get();
  if (snapshot.empty) return null;
  return toStoredResume(snapshot.docs[0].id, snapshot.docs[0].data());
}

/**
 * Uploads a PDF to Cloudinary, records it in Firestore, and makes it the
 * active resume — deactivating whatever was active before, in the same
 * batch write. A fresh upload going live immediately (rather than
 * needing a separate "Set Active" click) is the expected behavior here:
 * uploading a new resume IS the update.
 *
 * "Only one document may ever have active=true" is enforced by this
 * batch: every currently-active doc is explicitly set to false in the
 * same write that sets the new one to true.
 */
export async function uploadAndActivateResume(
  fileName: string,
  bytes: Buffer,
  _contentType: string
): Promise<StoredResume> {
  const { publicId, secureUrl } = await uploadPdfToCloudinary(bytes, fileName);

  const db = getDb();
  const collection = db.collection(COLLECTION);
  const newDocRef = collection.doc();

  const currentlyActive = await collection.where("active", "==", true).get();

  const batch = db.batch();
  currentlyActive.docs.forEach((doc) => batch.update(doc.ref, { active: false }));
  batch.set(newDocRef, {
    fileName,
    publicId,
    secureUrl,
    active: true,
    uploadedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  const snapshot = await newDocRef.get();
  return toStoredResume(newDocRef.id, snapshot.data()!);
}

/** Sets one resume active and unsets every other — enforced with a batch write, never two actives at once. */
export async function setActiveResume(id: string): Promise<void> {
  const db = getDb();
  const collection = db.collection(COLLECTION);

  const [target, currentlyActive] = await Promise.all([
    collection.doc(id).get(),
    collection.where("active", "==", true).get(),
  ]);

  if (!target.exists) {
    throw new Error("Resume not found.");
  }

  const batch = db.batch();
  currentlyActive.docs.forEach((doc) => {
    if (doc.id !== id) batch.update(doc.ref, { active: false });
  });
  batch.update(collection.doc(id), { active: true });
  await batch.commit();
}

/**
 * Deletes a resume's Cloudinary asset and Firestore record. If the
 * deleted resume was the active one, automatically activates the newest
 * remaining resume (by uploadedAt) — so the site is never left with zero
 * active resumes just because the active one got cleaned up, as long as
 * another one still exists.
 */
export async function deleteResume(id: string): Promise<void> {
  const db = getDb();
  const collection = db.collection(COLLECTION);
  const doc = await collection.doc(id).get();
  if (!doc.exists) return;

  const data = doc.data()!;
  const wasActive = data.active === true;

  await deletePdfFromCloudinary(data.publicId).catch((err) => {
    // If the Cloudinary asset is already gone, don't fail the whole
    // operation over it — the Firestore record is the source of truth
    // for what the admin dashboard shows.
    console.error(`[resumes] failed to delete Cloudinary asset ${data.publicId}:`, err);
  });
  await collection.doc(id).delete();

  if (wasActive) {
    const remaining = await collection.orderBy("uploadedAt", "desc").limit(1).get();
    if (!remaining.empty) {
      await collection.doc(remaining.docs[0].id).update({ active: true });
    }
  }
}
