import { NextResponse } from "next/server";
import { updateContest, deleteContest } from "@/lib/firestore-contests";
import { contestUpdateSchema } from "@/lib/contest-schema";

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

  const parsed = contestUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    await updateContest(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[admin/contests/${id}] update failed:`, err);
    return NextResponse.json({ error: "Failed to update contest link." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    await deleteContest(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[admin/contests/${id}] delete failed:`, err);
    return NextResponse.json({ error: "Failed to delete contest link." }, { status: 500 });
  }
}
