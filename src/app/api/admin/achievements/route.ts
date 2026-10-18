import { NextResponse } from "next/server";
import { listAllAchievements, createAchievement } from "@/lib/firestore-achievements";
import { achievementSchema } from "@/lib/achievement-schema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const achievements = await listAllAchievements();
    return NextResponse.json({ achievements });
  } catch (err) {
    console.error("[admin/achievements] list failed:", err);
    return NextResponse.json({ error: "Failed to load achievements." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Server-side validation regardless of what the client already checked
  // — including that `category` is one of the fixed, predefined values,
  // never arbitrary text (see achievement-schema.ts).
  const parsed = achievementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const id = await createAchievement(parsed.data);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[admin/achievements] create failed:", err);
    return NextResponse.json({ error: "Failed to create achievement." }, { status: 500 });
  }
}
