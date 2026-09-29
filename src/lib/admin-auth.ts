import "server-only";
import { getAdminEnv } from "./env";

/* ============================================================================
 * ADMIN SESSION COOKIE
 * ----------------------------------------------------------------------------
 * A minimal signed-cookie session — deliberately NOT a full auth library,
 * and deliberately NOT a database-backed session store. There is exactly
 * one admin account (the site owner), defined entirely by three env vars
 * (ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_SESSION_SECRET, see env.ts). A
 * JWT-shaped HMAC token is all that's needed for that.
 *
 * How it works, end to end:
 *   1. /admin/login checks the submitted email + password against
 *      ADMIN_EMAIL / ADMIN_PASSWORD (api/admin/login/route.ts).
 *   2. On success, createSessionToken() below produces a signed token
 *      (base64url payload + base64url HMAC signature, dot-separated —
 *      the same shape as a JWT, though this isn't using a JWT library).
 *   3. That token is set as an httpOnly cookie (see the login route).
 *   4. Every request to /admin/* or /api/admin/* is checked by
 *      middleware.ts, which calls verifySessionToken() below.
 *
 * Built on the Web Crypto API (`crypto.subtle`) instead of Node's
 * built-in `crypto` module specifically so this same file works
 * unmodified in TWO different JavaScript runtimes:
 *   - Node.js (inside API routes, e.g. api/admin/login/route.ts)
 *   - Edge     (inside middleware.ts, which Next.js always runs on Edge)
 * Node's `crypto` module doesn't exist on Edge, but Web Crypto works in
 * both — so using it here means "log in" and "check if logged in" share
 * the exact same signing code, instead of two implementations that could
 * quietly drift apart.
 * ==========================================================================*/

/** Name of the cookie that holds the signed session token. */
export const ADMIN_SESSION_COOKIE = "admin_session";

/** How long a login lasts before the admin has to log in again. */
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Uint8Array -> URL-safe base64 (no +, /, or padding — safe inside a cookie/token string). */
function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The inverse of toBase64Url — restores standard base64 padding, then decodes. */
function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    value.length + ((4 - (value.length % 4)) % 4),
    "="
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** Imports the session secret as a Web Crypto HMAC-SHA256 signing/verifying key. */
async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, // not extractable — the raw key material never needs to leave this function
    ["sign", "verify"]
  );
}

/**
 * Creates a signed session token good for 7 days. Called ONLY after the
 * login route has already confirmed the submitted email + password are
 * correct — this function itself doesn't check credentials, it just
 * issues proof that someone else already did.
 */
export async function createSessionToken(): Promise<string> {
  const env = getAdminEnv(); // <-- only admin vars; no Firebase/Resend dependency
  const payload = JSON.stringify({ exp: Date.now() + SESSION_DURATION_MS });
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload));

  const key = await getHmacKey(env.ADMIN_SESSION_SECRET);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const signatureB64 = toBase64Url(new Uint8Array(signature));

  // Token shape: "<base64url payload>.<base64url signature>"
  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies a session token's signature AND expiry. Called by
 * middleware.ts on every request to a protected admin route. Returns
 * `false` — never throws — for anything malformed, expired, tampered
 * with, or signed with an old secret; the caller always just treats
 * `false` as "not logged in, send them to /admin/login."
 */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payloadB64, signatureB64] = token.split(".");
  if (!payloadB64 || !signatureB64) return false;

  try {
    const env = getAdminEnv();
    const key = await getHmacKey(env.ADMIN_SESSION_SECRET);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signatureB64),
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) return false; // signature doesn't match -> forged or signed with an old secret

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    // Malformed base64, malformed JSON, etc. — treat as "not authenticated."
    return false;
  }
}

/**
 * Constant-time string comparison. Used for BOTH the email and password
 * checks in the login route, so a timing attack can't reveal — one
 * character at a time, by measuring response speed — which part of the
 * submitted credentials was wrong, or how much of it matched. A naive
 * `a === b` comparison returns as soon as the first mismatched character
 * is found, which leaks exactly that kind of timing signal; this always
 * walks the full length of both strings before returning.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}
