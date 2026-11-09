import { NextResponse } from "next/server";
import { updateAchievement, deleteAchievement } from "@/lib/firestore-achievements";
import { achievementUpdateSchema } from "@/lib/achievement-schema";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = achievementUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    await updateAchievement(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[admin/achievements/${id}] update failed:`, err);
    return NextResponse.json({ error: "Failed to update achievement." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    await deleteAchievement(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[admin/achievements/${id}] delete failed:`, err);
    return NextResponse.json({ error: "Failed to delete achievement." }, { status: 500 });
  }
}
