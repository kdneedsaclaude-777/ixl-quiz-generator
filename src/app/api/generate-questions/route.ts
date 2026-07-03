import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminForApi } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/rate-limit";

// Server-side proxy for the embedded PDF → questions generator (/admin/import).
// Keeps the API key server-side, requires an admin session, returns { questions }.
//
// LLM: Groq (free tier, OpenAI-compatible) when GROQ_API_KEY is set — the primary
// path. Falls back to Anthropic when only ANTHROPIC_API_KEY is set. Returns a
// clear 503 when neither is configured.

const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const ANTHROPIC_MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-4-7";
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

  const groqKey = process.env.GROQ_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!groqKey && !anthropicKey) {
    return NextResponse.json(
      { error: "AI is not configured yet — set GROQ_API_KEY (or ANTHROPIC_API_KEY) on the server to enable PDF generation." },
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

  const prompt = buildPrompt(sourceText, count, types);

  try {
    let raw: string;

    if (groqKey) {
      // Groq — OpenAI-compatible chat completions, JSON mode.
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GROQ_MODEL,
          max_tokens: MAX_TOKENS,
          temperature: 0.4,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("[generate-questions] Groq error", res.status, detail);
        return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 502 });
      }
      const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      raw = (j.choices?.[0]?.message?.content ?? "").trim();
    } else {
      const client = new Anthropic({ apiKey: anthropicKey! });
      const response = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
      });
      raw = response.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("")
        .trim();
    }

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
