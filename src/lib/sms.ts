// SMS delivery for phone verification. Mirrors src/lib/email.ts: when real
// Twilio creds are set the message goes out via Twilio's REST API; otherwise
// the code is logged to the console and the API endpoint returns it to the
// client (dev-only) so verification still works without a paid account.
//
// We don't add the Twilio SDK — a single REST call keeps the dependency
// surface minimal.

export function isRealSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM,
  );
}

// 6-digit numeric code as a string ("000000"–"999999"). Short TTL + attempt
// cap make hashing unnecessary; storing the plaintext code in the DB row is
// fine for this use case.
export function generateSmsCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

// Trim spaces/dashes/parens, require 7–15 digits and an optional leading +.
// Returns the canonical E.164 form ("+<digits>") or null if invalid.
export function normalizePhone(raw: string): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const stripped = trimmed.replace(/[\s\-()]/g, "");
  const m = stripped.match(/^\+?(\d{7,15})$/);
  if (!m) return null;
  return `+${m[1]}`;
}

type SendSmsArgs = { to: string; body: string };

export async function sendSms({ to, body }: SendSmsArgs): Promise<void> {
  if (!isRealSmsConfigured()) {
    // Dev fallback: never let a missing provider break the flow. The route
    // also returns the code to the caller so the UI can show it.
    console.log(`[sms][dev] To: ${to}\n${body}`);
    return;
  }
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM!;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const form = new URLSearchParams({ To: to, From: from, Body: body });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Twilio ${res.status}: ${detail}`);
    }
    console.log(`[sms] Sent to ${to}`);
  } catch (err) {
    // Surface in logs but don't crash the request — the caller checks
    // success indirectly (the code in the DB won't be verifiable if SMS
    // never went out, but the user can retry / use the dev fallback).
    console.error("[sms] send failed:", err);
  }
}
