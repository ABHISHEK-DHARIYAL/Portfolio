import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getBackendEnv } from "./env";

/**
 * Firebase Admin uses full-privilege service account credentials — it must
 * never run in, or be bundled into, client code. The `server-only` import
 * above makes Next.js throw a build error if a client component ever
 * imports this file, even by accident through a shared module.
 *
 * Initialized once per server process (Next.js can otherwise re-run this
 * module on every hot reload in dev, which throws "app already exists").
 *
 * Uses getBackendEnv() (Firebase/Resend vars only) — deliberately NOT
 * getAdminEnv() (the admin-login credentials). These two are unrelated:
 * this file needing Firebase configured has nothing to do with whether
 * someone can log into /admin. See env.ts for the full explanation.
 *
 * Firestore only — no Cloud Storage. This project used to also use
 * Firebase Storage (for resume PDF uploads from the admin dashboard),
 * but that required enabling Cloud Storage on the Firebase project,
 * which isn't available on every plan/setup. Resumes are now a static
 * file in /public/resume/ instead (see src/app/api/resume/route.ts), so
 * there's nothing here that touches Storage at all anymore.
 */
let app: App;

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }

  const env = getBackendEnv();

  app = initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    }),
  });
  return app;
}

let db: Firestore | null = null;

/** The Firestore client, shared across every request in this server process. */
export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getAdminApp());
  }
  return db;
}
