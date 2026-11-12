import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import { aboutSchema, type AboutContent } from "./about-schema";

// One document holds the whole About section.
const docRef = () => getDb().collection("site").doc("about");

/** The saved About content, or null if nothing valid has been saved yet. */
export async function getStoredAbout(): Promise<AboutContent | null> {
  const snap = await docRef().get();
  if (!snap.exists) return null;
  const parsed = aboutSchema.safeParse(snap.data()?.content);
  return parsed.success ? parsed.data : null;
}

export async function saveAbout(content: AboutContent): Promise<void> {
  await docRef().set({ content, updatedAt: FieldValue.serverTimestamp() });
}

/** Deletes the saved version so the site falls back to the built-in defaults. */
export async function resetAbout(): Promise<void> {
  await docRef().delete();
}
