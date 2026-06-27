// Pure validation + normalization for tutor sessions. No DB access — callers
// persist. Keeps route handlers thin and the rules unit-testable.

export type SessionStatus = "scheduled" | "completed" | "cancelled";

export const SESSION_STATUSES: SessionStatus[] = ["scheduled", "completed", "cancelled"];

export type TutorSessionInput = {
  scheduledAt?: string | null;
  durationMin?: number | null;
  focus?: string | null;
  notes?: string | null;
  status?: string | null;
};

export type ValidatedSession = {
  scheduledAt: Date;
  durationMin: number;
  focus: string | null;
  notes: string | null;
  status: SessionStatus;
};

export type ValidationResult =
  | { ok: true; value: ValidatedSession }
  | { ok: false; error: string };

// Validates + normalizes a create/update payload. Defaults: status
// "scheduled", duration 30. Duration must be 5..480 minutes. Free-text
// trimmed to null when empty, capped at 4000 chars.
export function validateTutorSession(input: TutorSessionInput): ValidationResult {
  const status = (input.status ?? "scheduled") as SessionStatus;
  if (!SESSION_STATUSES.includes(status)) {
    return { ok: false, error: `Invalid status "${input.status}".` };
  }

  if (!input.scheduledAt) return { ok: false, error: "A date/time is required." };
  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) return { ok: false, error: "Invalid date/time." };

  const durationMin = input.durationMin ?? 30;
  if (!Number.isFinite(durationMin) || durationMin < 5 || durationMin > 480) {
    return { ok: false, error: "Duration must be 5–480 minutes." };
  }

  const focus = normalizeText(input.focus);
  const notes = normalizeText(input.notes);
  if (focus && focus.length > 4000) return { ok: false, error: "Focus is too long (max 4000)." };
  if (notes && notes.length > 4000) return { ok: false, error: "Notes are too long (max 4000)." };

  return {
    ok: true,
    value: { scheduledAt, durationMin: Math.round(durationMin), focus, notes, status },
  };
}

function normalizeText(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}
