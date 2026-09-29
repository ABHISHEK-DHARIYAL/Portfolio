import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/contact-schema";
import { sanitizeContactFields } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, getUserAgent } from "@/lib/request-meta";
import { createContactMessage } from "@/lib/firestore-messages";
import { sendContactNotification } from "@/lib/email";
import { getBackendEnv } from "@/lib/env";

export const runtime = "nodejs"; // Firebase Admin requires the Node runtime, not Edge.

/**
 * POST /api/contact
 *
 * Pipeline: rate limit -> parse -> honeypot -> validate -> sanitize
 *           -> store in Firestore -> email via Resend -> respond.
 *
 * Firestore and email are intentionally NOT parallelized (no
 * Promise.all): the message must be durably stored before we even
 * attempt to email about it, and a Resend failure must never roll back
 * the Firestore write. See the error-handling contract below.
 */
export async function POST(req: Request) {
  // 1. Environment must be valid before anything else runs. A misconfigured
  //    deployment should fail every request the same, obvious way.
  try {
    getBackendEnv();
  } catch (err) {
    console.error("[contact] environment misconfigured:", err);
    return NextResponse.json(
      { error: "The contact form isn't configured yet. Please email directly instead." },
      { status: 503 }
    );
  }

  // 2. Rate limit by IP, before doing any real work.
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  // 3. Parse the request body.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // 4. Validate with Zod. This also enforces the honeypot (`company` must
  //    be empty). Bots that fill every field get a generic-looking
  //    rejection indistinguishable from a normal validation error — never
  //    a "we caught you" message that would teach them to adapt.
  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json(
      { error: "Please check the form for errors.", fieldErrors },
      { status: 400 }
    );
  }

  // Honeypot tripped: pretend success so the bot doesn't learn to omit the
  // field next time, but silently drop the submission — no Firestore
  // write, no email.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  // 5. Sanitize free-text fields before they touch storage or an email body.
  const clean = sanitizeContactFields(parsed.data);

  const ip_ = ip;
  const userAgent = getUserAgent(req);

  // 6. Store in Firestore FIRST. If this fails, stop — never send an email
  //    for a message that isn't durably recorded.
  let messageId: string;
  try {
    messageId = await createContactMessage({
      name: clean.name,
      email: clean.email,
      subject: clean.subject,
      message: clean.message,
      ipAddress: ip_,
      userAgent,
    });
  } catch (err) {
    console.error("[contact] Firestore write failed:", err);
    return NextResponse.json(
      { error: "Couldn't save your message right now. Please try again shortly." },
      { status: 500 }
    );
  }

  // 7. Send the email notification. This is best-effort: the message is
  //    already safely stored, so an email failure (bad API key, Resend
  //    outage, etc.) must not turn into an error response — the visitor
  //    did everything right and their message is not lost. Log loudly for
  //    the admin instead.
  try {
    await sendContactNotification({
      name: clean.name,
      email: clean.email,
      subject: clean.subject,
      message: clean.message,
      submittedAt: new Date(),
      ip: ip_,
      browser: userAgent,
    });
  } catch (err) {
    console.error(`[contact] Email notification failed for message ${messageId}:`, err);
    // Deliberately still returns 200 below — see comment above.
  }

  return NextResponse.json({ ok: true, id: messageId });
}
