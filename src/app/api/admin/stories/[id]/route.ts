import { NextResponse } from "next/server";
import { updateStory, deleteStory } from "@/lib/firestore-stories";
import { storyUpdateSchema } from "@/lib/story-schema";

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

  const parsed = storyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    await updateStory(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[admin/stories/${id}] update failed:`, err);
    return NextResponse.json({ error: "Failed to update story." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    await deleteStory(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[admin/stories/${id}] delete failed:`, err);
    return NextResponse.json({ error: "Failed to delete story." }, { status: 500 });
  }
}
