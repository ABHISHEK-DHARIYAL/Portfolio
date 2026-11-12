import { NextResponse } from "next/server";
import { getStoredJourney, saveJourney, resetJourney } from "@/lib/firestore-journey";
import { journeySchema } from "@/lib/journey-schema";
import { defaultJourney } from "@/data/timeline";

export const runtime = "nodejs";

// Auth: src/middleware.ts already requires a valid admin session for /api/admin/*.

export async function GET() {
  try {
    const stored = await getStoredJourney();
    return NextResponse.json({ journey: stored ?? defaultJourney, customized: Boolean(stored) });
  } catch (err) {
    console.error("[admin/journey] load failed:", err);
    return NextResponse.json({ error: "Failed to load Journey content." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = journeySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: first ? `${first.path.join(" › ") || "Form"}: ${first.message}` : "Please check the form for errors.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    await saveJourney(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/journey] save failed:", err);
    return NextResponse.json({ error: "Failed to save Journey content." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await resetJourney();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/journey] reset failed:", err);
    return NextResponse.json({ error: "Failed to reset Journey content." }, { status: 500 });
  }
}
