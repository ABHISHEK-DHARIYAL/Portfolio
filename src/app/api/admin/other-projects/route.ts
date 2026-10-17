import { NextResponse } from "next/server";
import { listOtherProjects, createOtherProject } from "@/lib/firestore-other-projects";
import { otherProjectSchema } from "@/lib/other-project-schema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const projects = await listOtherProjects();
    return NextResponse.json({ projects });
  } catch (err) {
    console.error("[admin/other-projects] list failed:", err);
    return NextResponse.json({ error: "Failed to load projects." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = otherProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form for errors." },
      { status: 400 }
    );
  }

  try {
    const id = await createOtherProject(parsed.data);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[admin/other-projects] create failed:", err);
    return NextResponse.json({ error: "Failed to create project." }, { status: 500 });
  }
}
