import { NextResponse } from "next/server";
import { listAllStories, createStory } from "@/lib/firestore-stories";
import { storySchema } from "@/lib/story-schema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stories = await listAllStories();
    return NextResponse.json({ stories });
  } catch (err) {
    console.error("[admin/stories] list failed:", err);
    return NextResponse.json({ error: "Failed to load stories." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = storySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const id = await createStory(parsed.data);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[admin/stories] create failed:", err);
    return NextResponse.json({ error: "Failed to create story." }, { status: 500 });
  }
}
