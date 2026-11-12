import { NextResponse } from "next/server";
import { getStoredHero, saveHero, resetHero } from "@/lib/firestore-hero";
import { heroSchema } from "@/lib/hero-schema";
import { defaultHero } from "@/data/hero";

export const runtime = "nodejs";

// Auth: src/middleware.ts already requires a valid admin session for /api/admin/*.

export async function GET() {
  try {
    const stored = await getStoredHero();
    return NextResponse.json({ hero: stored ?? defaultHero, customized: Boolean(stored) });
  } catch (err) {
    console.error("[admin/hero] load failed:", err);
    return NextResponse.json({ error: "Failed to load hero questions." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = heroSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first ? `${first.path.join(" › ") || "Form"}: ${first.message}` : "Please check the form for errors." },
      { status: 400 }
    );
  }

  try {
    await saveHero(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/hero] save failed:", err);
    return NextResponse.json({ error: "Failed to save hero questions." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await resetHero();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/hero] reset failed:", err);
    return NextResponse.json({ error: "Failed to reset hero questions." }, { status: 500 });
  }
}
