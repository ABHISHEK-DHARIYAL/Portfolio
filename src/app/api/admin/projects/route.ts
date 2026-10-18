import { NextResponse } from "next/server";
import { listAllProjects, createProject } from "@/lib/firestore-projects";
import { projectSchema } from "@/lib/project-schema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const projects = await listAllProjects();
    return NextResponse.json({ projects });
  } catch (err) {
    console.error("[admin/projects] list failed:", err);
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

  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const id = await createProject(parsed.data);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[admin/projects] create failed:", err);
    return NextResponse.json({ error: "Failed to create project." }, { status: 500 });
  }
}
