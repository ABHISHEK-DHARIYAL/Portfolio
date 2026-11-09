import { NextResponse } from "next/server";
import { setAchievementPdf, removeAchievementPdf } from "@/lib/firestore-achievements";

export const runtime = "nodejs";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB — same limit as resumes

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
  }
  if (file.size === 0) return NextResponse.json({ error: "File is empty." }, { status: 400 });
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File is too large — 10 MB max." }, { status: 400 });
  }

  try {
    await setAchievementPdf(id, file.name, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error(`[admin/achievements/${id}/pdf] upload failed:`, err);
    const message = err instanceof Error ? err.message : "Failed to upload PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    await removeAchievementPdf(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[admin/achievements/${id}/pdf] delete failed:`, err);
    return NextResponse.json({ error: "Failed to remove PDF." }, { status: 500 });
  }
}
