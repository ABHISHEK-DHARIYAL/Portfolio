/**
 * Best-effort client IP extraction. Behind a proxy/CDN (Vercel included),
 * the real client address is only available via headers, and which header
 * is authoritative depends on the platform — this checks the common ones
 * in order. None of this is spoof-proof against a determined attacker
 * hitting your origin directly, so treat it as a rate-limiting signal, not
 * an identity guarantee.
 */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const vercelIp = headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0].trim();

  return "unknown";
}

export function getUserAgent(req: Request): string {
  return req.headers.get("user-agent") ?? "unknown";
}
