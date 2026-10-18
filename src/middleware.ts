import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-auth";

/**
 * Admin route protection — runs on the Edge runtime, before any admin
 * page or API route executes.
 *
 * This file ONLY checks whether a valid, signed session cookie is
 * present (via verifySessionToken(), see src/lib/admin-auth.ts). It does
 * NOT check email or password — that verification happens exactly once,
 * in src/app/api/admin/login/route.ts, at login time. Every request
 * after that just proves "someone already logged in successfully and
 * this cookie is that proof, unexpired and unforged" — it doesn't
 * re-check credentials on every page load.
 *
 * Two paths are always allowed through unauthenticated: the login page
 * itself, and the login API route (otherwise no one could ever log in).
 * Everything else under /admin and /api/admin requires that valid
 * session cookie.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";
  if (isLoginPage || isLoginApi) {
    return NextResponse.next();
  }

  // No credentials are read or compared here — just "is this cookie a
  // validly signed, unexpired session token." See admin-auth.ts.
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const authenticated = await verifySessionToken(token);

  if (!authenticated) {
    // API routes get a plain 401 (a fetch() call can't follow a redirect
    // to an HTML login page usefully); page requests get redirected to
    // the login page, remembering where they were headed via ?next=.
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
