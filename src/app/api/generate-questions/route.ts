import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminForApi } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/rate-limit";

// Server-side proxy for the embedded PDF → questions generator (/admin/import).
// The browser tool used to call api.anthropic.com directly, which (a) leaked the
// API key into client code and (b) was blocked by CORS. This route keeps the key
// server-side, requires an admin session, and returns { questions: [...] }.
//
// Needs ANTHROPIC_API_KEY in the environment. Until that's provided it returns a
// clear 503 so the admin knows what's missing rather than seeing a CORS error.

const MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-4-7";
const MAX_TOKENS = 8_000;

type QuestionType = "mcq" | "true_false" | "fill_in_blank";

type Body = {
  text?: string;
  count?: number;
  types?: QuestionType[];
};

const TYPE_LABEL: Record<QuestionType, string> = {
  mcq: "multiple choice",
  true_false: "true/false",
  fill_in_blank: "fill-in-the-blank",
};

function buildPrompt(text: string, count: number, types: QuestionType[]): string {
  const typeNames = types.map((t) => TYPE_LABEL[t]).join(", ");
  return `You are an expert educational assessment designer.

Analyze the following text extracted from PDF documents and generate exactly ${count} quiz questions.

Question types to include (distribute evenly): ${typeNames}

STRICT JSON output rules:
- Return ONLY a raw JSON object — no markdown, no backticks, no preamble
- Use exactly these type values: "mcq", "true_false", "fill_in_blank"
- For mcq: include "options" (array of 4 strings) and "correct" (index 0-3)
- For true_false: include "options": ["True","False"] and "correct" (0 or 1)
- For fill_in_blank: the "text" field must contain exactly one "___" where the key term was removed; include "answer" with the missing term
- Every question must have: "type", "text", "concept", "explanation"

Output format:
{"questions":[{"type":"...","text":"...","options":[...],"correct":0,"concept":"...","explanation":"...","answer":"..."},...]}

PDF CONTENT:
${text}`;
}

export async function POST(req: Request): Promise<Response> {
  const limited = enforceRateLimit(req, "generate-questions", 20, 60_000);
  if (limited) return limited;

  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI is not configured yet — set ANTHROPIC_API_KEY on the server to enable PDF generation." },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "No source text provided." }, { status: 400 });

  const count = Math.max(1, Math.min(50, Math.floor(body.count ?? 10)));
  const validTypes = (Array.isArray(body.types) ? body.types : []).filter(
    (t): t is QuestionType => t === "mcq" || t === "true_false" || t === "fill_in_blank",
  );
  const types = validTypes.length ? validTypes : (["mcq"] as QuestionType[]);

  // Cap the input so a huge PDF can't run up the token bill; the client already
  // slices per-source, this is the backstop.
  const sourceText = text.slice(0, 24_000);

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: buildPrompt(sourceText, count, types) }],
    });
    const raw = response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    const clean = raw.replace(/```json|```/g, "").trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(clean);
    } catch {
      const m = clean.match(/\{[\s\S]*\}/);
      if (!m) return NextResponse.json({ error: "Could not parse AI response." }, { status: 502 });
      parsed = JSON.parse(m[0]);
    }

    const questions = (parsed as { questions?: unknown })?.questions;
    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "Unexpected AI response structure." }, { status: 502 });
    }

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[generate-questions] AI call failed", err);
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 502 });
  }
}
