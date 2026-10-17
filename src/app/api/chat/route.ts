import { NextResponse } from "next/server";
import { z } from "zod";
import { SYSTEM_PROMPT } from "@/lib/chat-knowledge";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-meta";

export const runtime = "nodejs";

/**
 * /api/chat — OPTIONAL real-AI mode for the portfolio chatbot.
 *
 *   GET  -> { ai: boolean }   whether an API key is configured
 *   POST -> { reply: string } answer grounded in the portfolio fact sheet
 *
 * If ANTHROPIC_API_KEY isn't set, GET reports ai:false and the chatbot runs
 * entirely on its built-in local engine — nothing else changes. The key is
 * read only here, on the server, and never reaches the browser.
 *
 * Guardrails: strict input schema, short history, capped output, per-IP
 * rate limit, and a system prompt that restricts answers to the site's own
 * data (see lib/chat-knowledge.ts).
 */

const MODEL = process.env.CHAT_MODEL || "claude-haiku-4-5-20251001";
const MAX_QUESTION_CHARS = 300;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1200),
      })
    )
    .min(1)
    .max(10),
});

export async function GET() {
  return NextResponse.json({ ai: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI mode is not configured." }, { status: 503 });
  }

  const rate = checkRateLimit(`chat:${getClientIp(req)}`, { maxRequests: 12, windowMs: 60_000 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "You're asking quickly — give it a few seconds and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } }
    );
  }

  let parsed;
  try {
    parsed = bodySchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // The API requires the conversation to start with a user turn and alternate.
  const history = parsed.data.messages;
  const last = history[history.length - 1];
  if (last.role !== "user" || last.content.length > MAX_QUESTION_CHARS) {
    return NextResponse.json({ error: "Please keep questions under 300 characters." }, { status: 400 });
  }
  const messages: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of history) {
    const prev = messages[messages.length - 1];
    if (prev && prev.role === m.role) prev.content += `\n${m.content}`;
    else messages.push({ role: m.role, content: m.content });
  }
  while (messages.length && messages[0].role !== "user") messages.shift();

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.error("[chat] upstream error:", res.status, await res.text().catch(() => ""));
      return NextResponse.json({ error: "The AI service is unavailable right now." }, { status: 502 });
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const reply = (data.content ?? [])
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!reply) {
      return NextResponse.json({ error: "Empty response." }, { status: 502 });
    }
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[chat] request failed:", err);
    return NextResponse.json({ error: "The AI service is unavailable right now." }, { status: 502 });
  }
}
