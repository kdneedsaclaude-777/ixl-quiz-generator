// CSV parsing + student-import validation. Pure (no DB) so it's fully
// unit-testable; the API layer feeds it the existing-parent/email lookups.
//
// Expected columns (header row, case-insensitive, order-independent):
//   name        (required)  student's display name
//   grade       (required)  integer 1–8
//   parentEmail (required)  email of an existing parent in the admin's org
//   difficulty  (optional)  integer 1–5, default 1
//   loginEmail  (optional)  if present, provisions a student login
//   loginPassword (optional) required iff loginEmail present

// RFC-4180-ish parser. Handles quoted fields, embedded commas/newlines, and
// doubled quotes. Returns rows as string[]; caller maps headers.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const s = text.replace(/\r\n?/g, "\n"); // normalize newlines

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); field = "";
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

const REQUIRED_HEADERS = ["name", "grade", "parentemail"] as const;
const KNOWN_HEADERS = ["name", "grade", "parentemail", "difficulty", "loginemail", "loginpassword"];

export type ParsedRow = {
  rowNumber: number; // 1-based, excluding header
  name: string;
  grade: number | null;
  parentEmail: string;
  difficulty: number;
  loginEmail: string | null;
  loginPassword: string | null;
};

export type RowError = { rowNumber: number; field: string; message: string };

export type HeaderResult =
  | { ok: true; index: Record<string, number> }
  | { ok: false; error: string };

export function validateHeaders(header: string[]): HeaderResult {
  const normalized = header.map((h) => h.trim().toLowerCase());
  const index: Record<string, number> = {};
  normalized.forEach((h, i) => { index[h] = i; });

  for (const req of REQUIRED_HEADERS) {
    if (!(req in index)) {
      return { ok: false, error: `Missing required column "${req}". Expected: name, grade, parentEmail (+ optional difficulty, loginEmail, loginPassword).` };
    }
  }
  const unknown = normalized.filter((h) => h && !KNOWN_HEADERS.includes(h));
  if (unknown.length) return { ok: false, error: `Unknown column(s): ${unknown.join(", ")}.` };
  return { ok: true, index };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Parses + per-row validates the body. Structural validation only — parent
// existence + email uniqueness are checked by the API against the DB.
export function parseStudentRows(rows: string[][]): { parsed: ParsedRow[]; errors: RowError[] } {
  const parsed: ParsedRow[] = [];
  const errors: RowError[] = [];
  if (rows.length === 0) return { parsed, errors };

  const headerResult = validateHeaders(rows[0]);
  if (!headerResult.ok) {
    return { parsed, errors: [{ rowNumber: 0, field: "header", message: headerResult.error }] };
  }
  const idx = headerResult.index;
  const get = (r: string[], key: string): string =>
    key in idx ? (r[idx[key]] ?? "").trim() : "";

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const rowNumber = i;
    const name = get(r, "name");
    const gradeRaw = get(r, "grade");
    const parentEmail = get(r, "parentemail").toLowerCase();
    const difficultyRaw = get(r, "difficulty");
    const loginEmail = get(r, "loginemail").toLowerCase() || null;
    const loginPassword = get(r, "loginpassword") || null;

    let hadError = false;
    if (!name) { errors.push({ rowNumber, field: "name", message: "Name is required." }); hadError = true; }

    const grade = /^\d+$/.test(gradeRaw) ? parseInt(gradeRaw, 10) : null;
    if (grade === null || grade < 1 || grade > 8) {
      errors.push({ rowNumber, field: "grade", message: `Grade must be 1–8 (got "${gradeRaw}").` });
      hadError = true;
    }

    if (!parentEmail || !EMAIL_RE.test(parentEmail)) {
      errors.push({ rowNumber, field: "parentEmail", message: `Invalid parent email "${parentEmail}".` });
      hadError = true;
    }

    let difficulty = 1;
    if (difficultyRaw) {
      if (!/^\d+$/.test(difficultyRaw) || +difficultyRaw < 1 || +difficultyRaw > 5) {
        errors.push({ rowNumber, field: "difficulty", message: `Difficulty must be 1–5 (got "${difficultyRaw}").` });
        hadError = true;
      } else {
        difficulty = parseInt(difficultyRaw, 10);
      }
    }

    if (loginEmail && !EMAIL_RE.test(loginEmail)) {
      errors.push({ rowNumber, field: "loginEmail", message: `Invalid login email "${loginEmail}".` });
      hadError = true;
    }
    if (loginEmail && !loginPassword) {
      errors.push({ rowNumber, field: "loginPassword", message: "loginPassword is required when loginEmail is set." });
      hadError = true;
    }

    if (!hadError) {
      parsed.push({ rowNumber, name, grade, parentEmail, difficulty, loginEmail, loginPassword });
    }
  }

  return { parsed, errors };
}
