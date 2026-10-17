import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

/**
 * POST /api/admin/logout
 *
 * Clears the session cookie by overwriting it with an empty value and an
 * immediate expiry (maxAge: 0). No credential checking happens here —
 * logging out doesn't require proving who you are, just telling the
 * browser to drop the cookie. Called from AdminHeader.tsx.
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
