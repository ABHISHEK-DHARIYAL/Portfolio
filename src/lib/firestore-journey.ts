import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import { journeySchema, type JourneyContent } from "./journey-schema";

// One document holds the whole Journey timeline.
const docRef = () => getDb().collection("site").doc("journey");

/** The saved Journey content, or null if nothing valid has been saved yet. */
export async function getStoredJourney(): Promise<JourneyContent | null> {
  const snap = await docRef().get();
  if (!snap.exists) return null;
  const parsed = journeySchema.safeParse(snap.data()?.content);
  return parsed.success ? parsed.data : null;
}

export async function saveJourney(content: JourneyContent): Promise<void> {
  await docRef().set({ content, updatedAt: FieldValue.serverTimestamp() });
}

/** Deletes the saved version so the site falls back to the built-in defaults. */
export async function resetJourney(): Promise<void> {
  await docRef().delete();
}
