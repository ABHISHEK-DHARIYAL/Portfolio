import { NextResponse } from "next/server";
import { updateProject, deleteProject } from "@/lib/firestore-projects";
import { projectUpdateSchema } from "@/lib/project-schema";

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

  const parsed = projectUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    await updateProject(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[admin/projects/${id}] update failed:`, err);
    return NextResponse.json({ error: "Failed to update project." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    await deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[admin/projects/${id}] delete failed:`, err);
    return NextResponse.json({ error: "Failed to delete project." }, { status: 500 });
  }
}
