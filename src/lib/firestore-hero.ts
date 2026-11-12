import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import { heroSchema, type HeroContent } from "./hero-schema";

// One document holds all the hero questions.
const docRef = () => getDb().collection("site").doc("hero");

/** The saved hero questions, or null if nothing valid has been saved yet. */
export async function getStoredHero(): Promise<HeroContent | null> {
  const snap = await docRef().get();
  if (!snap.exists) return null;
  const parsed = heroSchema.safeParse(snap.data()?.content);
  return parsed.success ? parsed.data : null;
}

export async function saveHero(content: HeroContent): Promise<void> {
  await docRef().set({ content, updatedAt: FieldValue.serverTimestamp() });
}

/** Deletes the saved version so the site falls back to the built-in defaults. */
export async function resetHero(): Promise<void> {
  await docRef().delete();
}
