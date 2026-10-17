import { getActiveResume } from "@/lib/firestore-resumes";

export const runtime = "nodejs";

const NOT_FOUND_HTML = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Resume not available</title></head>
<body style="background:#050816;color:#fff;font-family:-apple-system,Segoe UI,sans-serif;
display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <div style="text-align:center;max-width:22rem;padding:1.5rem;">
    <p style="font:600 12px/1 monospace;letter-spacing:.08em;text-transform:uppercase;color:#7C3AED;margin:0 0 8px;">Portfolio</p>
    <h1 style="font-size:20px;margin:0 0 8px;">No resume available yet</h1>
    <p style="color:rgba(255,255,255,.6);font-size:14px;margin:0;">Please check back soon, or reach out directly through the contact form.</p>
  </div>
</body>
</html>`;

function notFoundResponse(status: number) {
  return new Response(NOT_FOUND_HTML, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/**
 * GET /api/resume — public, no auth.
 *
 * 1. Query Firestore for the active resume.
 * 2. Redirect (307) to its Cloudinary `secureUrl`.
 *
 * The visitor never sees Cloudinary involved anywhere except in the final
 * redirect target's domain — every "Download Resume" button, the command
 * palette, and the terminal's `resume` command all still just point at
 * this same stable `/api/resume` URL, unchanged from before.
 *
 * `active.secureUrl` here is a SIGNED Cloudinary delivery URL, generated
 * fresh on every read (see toStoredResume() in firestore-resumes.ts) —
 * NOT a public/unsigned URL. Cloudinary blocks unsigned delivery of raw
 * PDF/ZIP files for accounts it flags "untrusted" (the default for new
 * accounts), which returns a 401 with `show_original_customer_untrusted`
 * — an earlier version of this code assumed uploaded assets were
 * shareable by default and hit exactly that error. Signed URLs bypass
 * the restriction regardless of account trust status. See the doc
 * comment in src/lib/cloudinary.ts for the full explanation. This route
 * itself needed no change for the fix — it already just redirects
 * straight to whatever secureUrl it's given, which is the correct
 * behavior; the fix lives in how that URL gets built.
 */
export async function GET() {
  let active;
  try {
    active = await getActiveResume();
  } catch (err) {
    console.error("[resume] Firestore fetch failed:", err);
    return notFoundResponse(503);
  }

  if (!active) {
    return notFoundResponse(404);
  }

  return Response.redirect(active.secureUrl, 307);
}
