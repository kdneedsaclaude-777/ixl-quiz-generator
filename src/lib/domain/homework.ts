// Pure validation for homework assignments. No DB — callers persist.

export type HomeworkStatus = "active" | "completed" | "archived";
export const HOMEWORK_STATUSES: HomeworkStatus[] = ["active", "completed", "archived"];

export type HomeworkInput = {
  title?: string | null;
  instructions?: string | null;
  assignedSkillIds?: unknown;
  dueAt?: string | null;
  status?: string | null;
};

export type ValidatedHomework = {
  title: string;
  instructions: string | null;
  assignedSkillIds: number[];
  dueAt: Date | null;
  status: HomeworkStatus;
};

export type HomeworkValidation =
  | { ok: true; value: ValidatedHomework }
  | { ok: false; error: string };

export function validateHomework(input: HomeworkInput): HomeworkValidation {
  const title = (input.title ?? "").trim();
  if (!title) return { ok: false, error: "A title is required." };
  if (title.length > 200) return { ok: false, error: "Title is too long (max 200)." };

  const status = (input.status ?? "active") as HomeworkStatus;
  if (!HOMEWORK_STATUSES.includes(status)) {
    return { ok: false, error: `Invalid status "${input.status}".` };
  }

  const ids = normalizeSkillIds(input.assignedSkillIds);
  if (ids === null) return { ok: false, error: "assignedSkillIds must be an array of skill ids." };
  if (ids.length > 50) return { ok: false, error: "Too many skills (max 50)." };

  const instructions = normalizeText(input.instructions);
  if (instructions && instructions.length > 4000) {
    return { ok: false, error: "Instructions too long (max 4000)." };
  }

  let dueAt: Date | null = null;
  if (input.dueAt) {
    const d = new Date(input.dueAt);
    if (Number.isNaN(d.getTime())) return { ok: false, error: "Invalid due date." };
    dueAt = d;
  }

  return { ok: true, value: { title, instructions, assignedSkillIds: ids, dueAt, status } };
}

// Reads the stored assignedSkillIds (a JSON-encoded string in SQLite) back
// into a number[]. Tolerant: bad/missing data → []. Use everywhere that
// reads HomeworkAssignment.assignedSkillIds off the DB.
export function parseSkillIds(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw.filter((n): n is number => Number.isInteger(n));
  if (typeof raw === "string") {
    try {
      const a = JSON.parse(raw);
      return Array.isArray(a) ? a.filter((n): n is number => Number.isInteger(n)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Returns a deduped number[] or null if the shape is wrong. Empty array OK.
export function normalizeSkillIds(raw: unknown): number[] | null {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return null;
  const out = new Set<number>();
  for (const v of raw) {
    const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
    if (!Number.isInteger(n)) return null;
    out.add(n);
  }
  return [...out];
}

function normalizeText(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}
