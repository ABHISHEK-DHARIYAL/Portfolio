import "server-only";
import { z } from "zod";

/* ============================================================================
 * WHY THIS FILE IS SPLIT IN TWO
 * ----------------------------------------------------------------------------
 * Earlier, every env var (Firebase, Resend, AND admin login) lived in one
 * combined schema, validated together. That meant: if you hadn't finished
 * setting up the Firebase/Resend backend yet, the admin login route would
 * fail with "not configured" — even though login only actually needs the
 * three ADMIN_* variables and has nothing to do with Firebase or Resend.
 *
 * That was a real bug, not just a style choice: it's the most likely reason
 * admin login wasn't working. Fixed by validating admin credentials and the
 * Firebase/Resend backend completely independently, each lazily and each
 * cached separately. Now /admin/login works the moment ADMIN_EMAIL,
 * ADMIN_PASSWORD, and ADMIN_SESSION_SECRET are set, regardless of whether
 * Firebase/Resend are configured yet.
 * ==========================================================================*/

// ---------------------------------------------------------------------------
// Group 1: Admin login credentials.
// Only these three variables gate /admin/login. Nothing else does.
// ---------------------------------------------------------------------------
const adminEnvSchema = z.object({
  // The ONE email address allowed to log in. There is no user database and
  // no sign-up flow anywhere in this app — this single value, checked
  // against ADMIN_PASSWORD, IS the entire admin account. Never displayed
  // back to the browser in any response, error message, or page source —
  // see src/app/(admin)/admin/login/page.tsx and the login API route for
  // where that's enforced.
  ADMIN_EMAIL: z.string().trim().toLowerCase().email("ADMIN_EMAIL must be a valid email address"),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters"),
  // Signs the session cookie issued after a successful login. Generate with:
  //   openssl rand -hex 32
  // Changing this instantly logs out every existing admin session.
  ADMIN_SESSION_SECRET: z
    .string()
    .min(16, "ADMIN_SESSION_SECRET must be at least 16 characters"),
});

export type AdminEnv = z.infer<typeof adminEnvSchema>;

let cachedAdminEnv: AdminEnv | null = null;

/**
 * Validated on first use by the login route and by admin-auth.ts (session
 * signing/verification) — NOT by anything Firebase- or Resend-related.
 * This is deliberately the only env accessor those two files are allowed
 * to call.
 */
export function getAdminEnv(): AdminEnv {
  if (cachedAdminEnv) return cachedAdminEnv;

  const parsed = adminEnvSchema.safeParse({
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(
      `Admin login isn't configured yet — missing or invalid environment variables:\n${issues.join("\n")}\n` +
        "Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET in .env.local. See the README."
    );
  }

  cachedAdminEnv = parsed.data;
  return cachedAdminEnv;
}

// ---------------------------------------------------------------------------
// Group 2: Firebase (Firestore) + Resend + Cloudinary — the
// contact/projects/resume backend. Completely separate from admin login
// on purpose (see comment at top).
// ---------------------------------------------------------------------------
const backendEnvSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID is required"),
  FIREBASE_CLIENT_EMAIL: z
    .string()
    .email("FIREBASE_CLIENT_EMAIL must be the service account's email address"),
  // Private keys from most hosting dashboards (including Vercel) arrive with
  // literal "\n" sequences instead of real newlines — normalized below.
  FIREBASE_PRIVATE_KEY: z.string().min(1, "FIREBASE_PRIVATE_KEY is required"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  CONTACT_RECIPIENT_EMAIL: z.string().email().default("dhariyalabhi@gmail.com"),
  // Cloudinary — where resume PDFs are stored (replaces Firebase Storage,
  // which required enabling Cloud Storage on the Firebase project; not
  // available on every plan/setup). All three come from the Cloudinary
  // dashboard and are used for SIGNED, server-side uploads only — never
  // sent to the browser. See README "Setting up Cloudinary."
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
});

export type BackendEnv = z.infer<typeof backendEnvSchema>;

let cachedBackendEnv: BackendEnv | null = null;

/**
 * Validated on first use by firebase-admin.ts, email.ts, and
 * cloudinary.ts — i.e. by anything that touches Firestore, Resend, or
 * Cloudinary. Admin login (env.ts's other half, above) never calls this.
 */
export function getBackendEnv(): BackendEnv {
  if (cachedBackendEnv) return cachedBackendEnv;

  const parsed = backendEnvSchema.safeParse({
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_RECIPIENT_EMAIL: process.env.CONTACT_RECIPIENT_EMAIL || undefined,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(
      `Missing or invalid environment variables:\n${issues.join("\n")}\n` +
        "See .env.example and the README for setup instructions."
    );
  }

  cachedBackendEnv = {
    ...parsed.data,
    // Real key material is PEM-formatted and needs actual newlines, not
    // the escaped "\n" text most dashboards store it as.
    FIREBASE_PRIVATE_KEY: parsed.data.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
  return cachedBackendEnv;
}
