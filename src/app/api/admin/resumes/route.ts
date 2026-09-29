import { NextResponse } from "next/server";
import { listResumes, uploadAndActivateResume } from "@/lib/firestore-resumes";

export const runtime = "nodejs";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set(["application/pdf"]);

export async function GET() {
  try {
    const resumes = await listResumes();
    return NextResponse.json({ resumes });
  } catch (err) {
    console.error("[admin/resumes] list failed:", err);
    return NextResponse.json({ error: "Failed to load resumes." }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File is too large — 10 MB max." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty." }, { status: 400 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    // Uploads to Cloudinary, records it in Firestore, and makes it the
    // active resume in one step — see the doc comment on
    // uploadAndActivateResume() in firestore-resumes.ts.
    const resume = await uploadAndActivateResume(file.name, bytes, file.type);
    return NextResponse.json({ ok: true, resume }, { status: 201 });
  } catch (err) {
    console.error("[admin/resumes] upload failed:", err);
    // This route is behind admin auth (middleware.ts) — unlike a public
    // route, it's safe and actively useful to return the real error
    // message here rather than a generic one. Cloudinary/Firestore
    // errors (bad credentials, network issues, etc.) are specific and
    // actionable; hiding them just makes the problem harder to diagnose
    // for the one person who's allowed to see this response anyway.
    const message = err instanceof Error ? err.message : "Failed to upload resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
