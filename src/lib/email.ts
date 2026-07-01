import nodemailer, { type Transporter } from "nodemailer";

// Real SMTP when SMTP_HOST + SMTP_USER + SMTP_PASS are all set (production);
// otherwise a lazily-created Ethereal test account (dev). Either way the
// transport is cached for the process lifetime.
let cachedTransporter: Transporter | null = null;
let cachedFrom = "QuizSpark <noreply@cm.local>";

function realSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
}

function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

// Provider preference. Default (unset) = "auto": Resend if a key is set, else
// SMTP. Set EMAIL_PROVIDER=smtp (or "gmail") to MUTE Resend and force SMTP/Gmail
// even when a Resend key is still present — a clean, reversible switch (no need
// to delete RESEND_API_KEY).
function preferSmtp(): boolean {
  const p = (process.env.EMAIL_PROVIDER ?? "").toLowerCase();
  return p === "smtp" || p === "gmail";
}

// True when Resend should actually be used for sending.
function useResend(): boolean {
  return resendConfigured() && !preferSmtp();
}

// Resend has a tiny REST API, so we hit it with fetch rather than adding a
// dependency. Throws on a non-2xx so sendEmail's catch logs the body and
// still surfaces the link in the console.
async function sendViaResend(args: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const from =
    process.env.EMAIL_FROM ?? "QuizSpark <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      text: args.text,
      html: args.html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
  console.log(`[email] Sent via Resend → ${args.to}`);
}

async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) return cachedTransporter;

  if (realSmtpConfigured()) {
    const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // Explicit SMTP_SECURE wins; otherwise secure only on the implicit-TLS
      // port 465.
      secure: process.env.SMTP_SECURE
        ? process.env.SMTP_SECURE === "true"
        : port === 465,
      auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    });
    cachedFrom = process.env.EMAIL_FROM ?? process.env.SMTP_USER!;
    console.log(`[email] SMTP transport ready (host=${process.env.SMTP_HOST}).`);
    return cachedTransporter;
  }

  const test = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: test.smtp.host,
    port: test.smtp.port,
    secure: test.smtp.secure,
    auth: { user: test.user, pass: test.pass },
  });
  cachedFrom = `QuizSpark <${test.user}>`;
  console.log(`[email] Ethereal account ready (user=${test.user}).`);
  return cachedTransporter;
}

// True when a real delivery channel (Resend or SMTP) is configured; false
// means the Ethereal dev fallback is in use. Exported so dev-only flows
// (e.g. surfacing a verification link in the UI) gate on it and never leak
// once real email works.
export function isRealEmailConfigured(): boolean {
  if (preferSmtp()) return realSmtpConfigured();
  return resendConfigured() || realSmtpConfigured();
}

type SendArgs = { to: string; subject: string; text: string; html?: string };
// `ok` reports whether the message was actually handed off to a delivery
// channel. It stays false when the send throws (bad SMTP creds, port blocked,
// Gmail rejects) so callers can tell the user "we couldn't email you" instead
// of silently claiming success. `previewUrl` is only set for the Ethereal dev
// fallback.
type SendResult = { previewUrl: string | null; ok: boolean; error?: string };

export async function sendEmail({ to, subject, text, html }: SendArgs): Promise<SendResult> {
  try {
    // Resend unless it's been muted via EMAIL_PROVIDER=smtp/gmail.
    if (useResend()) {
      await sendViaResend({ to, subject, text, html });
      return { previewUrl: null, ok: true };
    }
    const transporter = await getTransporter();
    const info = await transporter.sendMail({ from: cachedFrom, to, subject, text, html });
    const preview = nodemailer.getTestMessageUrl(info) || null;
    console.log(`[email] To: ${to} | Subject: ${subject}`);
    if (preview) console.log(`[email] Preview: ${preview}`);
    return { previewUrl: preview, ok: true };
  } catch (err) {
    // Never let email failures break the auth flow — but report ok:false so the
    // caller can surface the problem. Log everything for debugging.
    console.error("[email] send failed:", err);
    console.log(`[email][fallback] To: ${to} | Subject: ${subject}\n${text}`);
    return { previewUrl: null, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function buildAppUrl(path: string): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
