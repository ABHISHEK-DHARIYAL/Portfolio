import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminEnv } from "@/lib/env";
import { createSessionToken, ADMIN_SESSION_COOKIE, timingSafeEqual } from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-meta";

/**
 * POST /api/admin/login
 *
 * There is exactly ONE admin account, defined entirely by ADMIN_EMAIL +
 * ADMIN_PASSWORD in the environment — no user database, no sign-up flow.
 * This route's only job is: does the submitted email+password match those
 * two env vars? If yes, issue a session cookie. If no, say so generically.
 *
 * Two things worth calling out explicitly:
 *
 * 1. Uses getAdminEnv() — NOT the Firebase/Resend env group — so this
 *    route works the moment ADMIN_EMAIL / ADMIN_PASSWORD /
 *    ADMIN_SESSION_SECRET are set, even if Firebase or Resend aren't
 *    configured yet. See env.ts for why that split exists; it's the fix
 *    for admin login not working when the rest of the backend wasn't set
 *    up yet.
 *
 * 2. The configured ADMIN_EMAIL is never echoed back in any response —
 *    not on success, not on failure, not in an error message. A wrong
 *    email and a wrong password produce the exact same generic
 *    "Invalid email or password" response, so nobody probing this route
 *    can learn which part they got wrong, let alone what the real email
 *    is. The only place the real address exists is your own .env file.
 */

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const GENERIC_ERROR = "Invalid email or password.";

export async function POST(req: Request) {
  // Admin credentials must be configured before anything else happens.
  let env;
  try {
    env = getAdminEnv();
  } catch (err) {
    console.error("[admin/login] environment misconfigured:", err);
    return NextResponse.json(
      { error: "Admin login isn't configured yet. Set ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_SESSION_SECRET." },
      { status: 503 }
    );
  }

  // Strict rate limit: 5 attempts per 15 minutes per IP, to make
  // credential guessing impractical without needing account lockouts or
  // CAPTCHAs. Keyed separately from the contact form's rate limit.
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`login:${ip}`, {
    windowMs: 15 * 60_000,
    maxRequests: 5,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    // Still generic — "email/password required" would already tell an
    // attacker their request shape was fine and just missing a field,
    // which is more information than a failed login needs to give up.
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  // Check EMAIL and PASSWORD independently, both with constant-time
  // comparison, but respond with the identical generic error either way
  // — the response never reveals which of the two was wrong.
  const emailMatches = timingSafeEqual(parsed.data.email, env.ADMIN_EMAIL);
  const passwordMatches = timingSafeEqual(parsed.data.password, env.ADMIN_PASSWORD);

  if (!emailMatches || !passwordMatches) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  // Both matched — issue the signed session cookie. See admin-auth.ts.
  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true, // never readable from client-side JS
    secure: process.env.NODE_ENV === "production", // HTTPS-only in production
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days, matches the token's own expiry in admin-auth.ts
  });
  return res;
}
