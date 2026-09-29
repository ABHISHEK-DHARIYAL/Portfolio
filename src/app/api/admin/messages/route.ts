import { NextResponse } from "next/server";
import { z } from "zod";
import { listContactMessages } from "@/lib/firestore-messages";

export const runtime = "nodejs"; // Firebase Admin requires Node, not Edge.

const querySchema = z.object({
  status: z.enum(["unread", "read", "all"]).default("all"),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const parsed = querySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  try {
    const result = await listContactMessages(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin/messages] list failed:", err);
    return NextResponse.json({ error: "Failed to load messages." }, { status: 500 });
  }
}
