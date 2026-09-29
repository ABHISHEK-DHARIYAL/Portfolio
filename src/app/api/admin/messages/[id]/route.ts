import { NextResponse } from "next/server";
import { z } from "zod";
import { setMessageStatus, deleteContactMessage } from "@/lib/firestore-messages";

export const runtime = "nodejs";

const patchSchema = z.object({ status: z.enum(["unread", "read"]) });

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
    return NextResponse.json({ error: "status must be 'unread' or 'read'." }, { status: 400 });
  }

  try {
    await setMessageStatus(id, parsed.data.status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[admin/messages/${id}] status update failed:`, err);
    return NextResponse.json({ error: "Failed to update message." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    await deleteContactMessage(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[admin/messages/${id}] delete failed:`, err);
    return NextResponse.json({ error: "Failed to delete message." }, { status: 500 });
  }
}
