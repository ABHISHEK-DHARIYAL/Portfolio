import { NextResponse } from "next/server";
import { getStoredAbout, saveAbout, resetAbout } from "@/lib/firestore-about";
import { aboutSchema } from "@/lib/about-schema";
import { defaultAbout } from "@/data/about";

export const runtime = "nodejs";

// Auth: src/middleware.ts already requires a valid admin session for /api/admin/*.

export async function GET() {
  try {
    const stored = await getStoredAbout();
    return NextResponse.json({ about: stored ?? defaultAbout, customized: Boolean(stored) });
  } catch (err) {
    console.error("[admin/about] load failed:", err);
    return NextResponse.json({ error: "Failed to load About content." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = aboutSchema.safeParse(body);
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
    await saveAbout(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/about] save failed:", err);
    return NextResponse.json({ error: "Failed to save About content." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await resetAbout();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/about] reset failed:", err);
    return NextResponse.json({ error: "Failed to reset About content." }, { status: 500 });
  }
}
