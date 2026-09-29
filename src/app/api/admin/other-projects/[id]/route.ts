import { NextResponse } from "next/server";
import { updateOtherProject, deleteOtherProject } from "@/lib/firestore-other-projects";
import { otherProjectUpdateSchema } from "@/lib/other-project-schema";

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

  const parsed = otherProjectUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form for errors." },
      { status: 400 }
    );
  }

  try {
    await updateOtherProject(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[admin/other-projects/${id}] update failed:`, err);
    // updateOtherProject() throws a specific, user-facing message for
    // the "would leave both links empty" case — surface it as-is rather
    // than a generic 500, since it's a validation failure, not a
    // server error.
    const message = err instanceof Error ? err.message : "Failed to update project.";
    const status = message.includes("at least a website") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    await deleteOtherProject(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[admin/other-projects/${id}] delete failed:`, err);
    return NextResponse.json({ error: "Failed to delete project." }, { status: 500 });
  }
}
