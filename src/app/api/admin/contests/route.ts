import { NextResponse } from "next/server";
import { listAllContests, createContest } from "@/lib/firestore-contests";
import { contestSchema } from "@/lib/contest-schema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const contests = await listAllContests();
    return NextResponse.json({ contests });
  } catch (err) {
    console.error("[admin/contests] list failed:", err);
    return NextResponse.json({ error: "Failed to load contest links." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = contestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const id = await createContest(parsed.data);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[admin/contests] create failed:", err);
    return NextResponse.json({ error: "Failed to add contest link." }, { status: 500 });
  }
}
