import { getPublicAchievementPdfUrl } from "@/lib/firestore-achievements";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/achievements/:id/pdf — public. Redirects to the achievement's PDF
 * (stored in the same Cloudinary storage as the resume), but only when the
 * achievement is visible AND its PDF is switched on. Otherwise: 404.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const url = await getPublicAchievementPdfUrl(id);
    if (!url) return new Response("Not found", { status: 404 });
    return Response.redirect(url, 307);
  } catch (err) {
    console.error(`[achievements/${id}/pdf] failed:`, err);
    return new Response("Unavailable", { status: 503 });
  }
}
