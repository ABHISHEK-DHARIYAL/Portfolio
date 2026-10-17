import { NextResponse } from "next/server";
import { z } from "zod";
import { setActiveResume, deleteResume } from "@/lib/firestore-resumes";

export const runtime = "nodejs";

const patchSchema = z.object({ active: z.literal(true) });

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Only { active: true } is supported here." }, { status: 400 });
  }

  try {
    await setActiveResume(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[admin/resumes/${id}] set-active failed:`, err);
    return NextResponse.json({ error: "Failed to set active resume." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    // If this was the active resume, deleteResume() automatically
    // activates the newest remaining one (if any) — see its doc comment
    // in firestore-resumes.ts.
    await deleteResume(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[admin/resumes/${id}] delete failed:`, err);
    return NextResponse.json({ error: "Failed to delete resume." }, { status: 500 });
  }
}
