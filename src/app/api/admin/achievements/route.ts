import { NextResponse } from "next/server";
import { listAllAchievements, createAchievement } from "@/lib/firestore-achievements";
import { achievementSchema } from "@/lib/achievement-schema";

export const runtime = "nodejs";

/** GET /api/admin/achievements — every achievement (visible or hidden), newest first. */
export async function GET() {
  try {
    const achievements = await listAllAchievements();
    return NextResponse.json({ achievements });
  } catch (err) {
    console.error("[admin/achievements] list failed:", err);
    return NextResponse.json({ error: "Failed to load achievements." }, { status: 500 });
  }
}

/** POST /api/admin/achievements — create a new achievement. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

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
    return NextResponse.json({ error: "Failed to add achievement." }, { status: 500 });
  }
}