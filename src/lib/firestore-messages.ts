import "server-only";
import { FieldValue, Timestamp, type Query } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";

const COLLECTION = "contact_messages";

export type MessageStatus = "unread" | "read";

export type ContactMessageInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ContactMessage = ContactMessageInput & {
  id: string;
  status: MessageStatus;
  /** ISO 8601 string — Firestore Timestamps aren't directly serializable to JSON. */
  createdAt: string;
};

/** Creates a new message document. Called only after Zod validation passes. */
export async function createContactMessage(input: ContactMessageInput): Promise<string> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).add({
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    status: "unread" satisfies MessageStatus,
    createdAt: FieldValue.serverTimestamp(),
  });
  return doc.id;
}

export type ListMessagesParams = {
  status?: MessageStatus | "all";
  sort?: "newest" | "oldest";
  pageSize?: number;
  /** Document ID to start after, for cursor-based pagination. */
  cursor?: string;
};

export type ListMessagesResult = {
  messages: ContactMessage[];
  nextCursor: string | null;
};

/**
 * Lists messages with server-side status filtering, sorting, and cursor
 * pagination. Firestore has no native full-text search, so free-text
 * "search" across name/email/subject/message is intentionally NOT done
 * here — the admin dashboard applies it client-side over each fetched
 * page instead. That's a real limitation, not an oversight: see the
 * README's admin dashboard section for what a production upgrade path
 * (Algolia / Typesense / a search-optimized read model) would look like.
 */
export async function listContactMessages(
  params: ListMessagesParams = {}
): Promise<ListMessagesResult> {
  const db = getDb();
  const { status = "all", sort = "newest", pageSize = 20, cursor } = params;

  let query: Query = db.collection(COLLECTION);

  if (status !== "all") {
    query = query.where("status", "==", status);
  }

  query = query.orderBy("createdAt", sort === "newest" ? "desc" : "asc");

  if (cursor) {
    const cursorDoc = await db.collection(COLLECTION).doc(cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  // Fetch one extra document to know whether a next page exists.
  const snapshot = await query.limit(pageSize + 1).get();
  const docs = snapshot.docs.slice(0, pageSize);
  const hasMore = snapshot.docs.length > pageSize;

  const messages: ContactMessage[] = docs.map((doc) => {
    const data = doc.data();
    const createdAt = data.createdAt as Timestamp | undefined;
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: data.status,
      ipAddress: data.ipAddress ?? undefined,
      userAgent: data.userAgent ?? undefined,
      // Fall back to "now" for the rare read that lands between the write
      // and the server timestamp resolving — avoids a null crash in the UI.
      createdAt: (createdAt?.toDate() ?? new Date()).toISOString(),
    };
  });

  return {
    messages,
    nextCursor: hasMore ? docs[docs.length - 1].id : null,
  };
}

export async function setMessageStatus(id: string, status: MessageStatus): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTION).doc(id).update({ status });
}

export async function deleteContactMessage(id: string): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTION).doc(id).delete();
}
