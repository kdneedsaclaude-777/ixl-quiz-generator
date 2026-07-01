// HTML email rendering. Email HTML is unlike web HTML — many clients strip
// <style> blocks, ignore class selectors, and only respect inline CSS on
// <table>/<td>. So everything here is a nested table with inline styles,
// rendered through one renderer so every email looks the same.
//
// Every render also emits a plain-text version derived from the same payload.
// That way callers never duplicate the message and the text/html stay in
// sync. Email clients that block HTML (or strip it for accessibility) get
// the text version automatically.

export type EmailCTA = { label: string; url: string };

export type EmailPayload = {
  // Hidden text Gmail / Outlook show next to the subject in the inbox list.
  // Should hint at the body content without giving away the punchline.
  preheader?: string;
  // Bold line at the top of the body card (h2-equivalent).
  heading: string;
  // One paragraph or several. Each string becomes its own <p> with a gap.
  body: string | string[];
  // Optional big, centered, letter-spaced verification code box (e.g. a 6-digit
  // email code). Rendered between the body paragraphs and the list/CTA.
  code?: string;
  // Optional bulleted list — used by digests and any "here's a summary" mail.
  items?: string[];
  // Primary call-to-action button. Omit for security notices that shouldn't
  // push the user to click anything from a potentially-spoofed sender.
  cta?: EmailCTA;
  // Small grey text under the CTA — security disclaimers, ignore-if-you
  // language, etc.
  footnote?: string;
};

// Visual tokens — Hawaiian-themed brand palette. Ocean teal for the header
// (evokes the sea), hibiscus coral for the CTA (the state flower), sandy
// canvas + warm divider lines. Hex only; named colors don't render in every
// client.
const C = {
  bg: "#fffbeb",          // amber-50 — sandy beach
  card: "#ffffff",         // body card
  brand: "#0d9488",        // teal-600 — deep ocean (header bar)
  brandDark: "#0f766e",    // teal-700 — header bar bottom edge
  accent: "#f43f5e",       // rose-500 — hibiscus (CTA button)
  accentDark: "#e11d48",   // rose-600 — button border
  text: "#0f172a",         // slate-900
  textSoft: "#334155",     // slate-700
  textMuted: "#64748b",    // slate-500
  textFaint: "#a8a29e",    // stone-400 — warmer than slate for sandy footer
  divider: "#fde68a",      // amber-200 — sunset-y rule
  footerBg: "#fef3c7",     // amber-100 — sandy footer band
} as const;

// Inline font stack that maps cleanly across Apple Mail, Gmail, Outlook.
// No external @font-face — many clients block remote fonts.
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Make a URL inside body prose clickable. We keep this scoped to bare
// "https://…" or "http://…" tokens delimited by whitespace so we don't
// accidentally chew sentence punctuation.
function linkify(s: string): string {
  return s.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) =>
      `<a href="${esc(url)}" style="color:${C.brand};text-decoration:underline;">${esc(url)}</a>`,
  );
}

function renderParagraphs(body: string | string[]): string {
  const paras = Array.isArray(body) ? body : [body];
  return paras
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${C.textSoft};">${linkify(esc(p))}</p>`,
    )
    .join("");
}

function renderItems(items: string[] | undefined): string {
  if (!items || items.length === 0) return "";
  const rows = items
    .map(
      (it) =>
        `<li style="margin:0 0 8px;padding-left:6px;font-size:15px;line-height:1.5;color:${C.textSoft};">${linkify(esc(it))}</li>`,
    )
    .join("");
  return `<ul style="margin:0 0 20px;padding:0 0 0 20px;list-style-type:disc;">${rows}</ul>`;
}

function renderCode(code: string | undefined): string {
  if (!code) return "";
  // Big, tappable-to-select, letter-spaced code box. Monospaced digits on a
  // tinted card so it reads clearly across clients.
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 20px;width:100%;">
      <tr>
        <td align="center" style="background:${C.footerBg};border:1px solid ${C.divider};border-radius:10px;padding:18px 24px;">
          <div style="font-size:34px;font-weight:700;letter-spacing:10px;color:${C.text};font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;">${esc(code)}</div>
        </td>
      </tr>
    </table>`;
}

function renderCTA(cta: EmailCTA | undefined): string {
  if (!cta) return "";
  // Table-wrapped button — Outlook ignores padding on <a>, so the padding
  // has to live on the surrounding <td>. Button color is the hibiscus
  // accent (pops against the teal header).
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;">
      <tr>
        <td style="background:${C.accent};border-radius:8px;border:1px solid ${C.accentDark};">
          <a href="${esc(cta.url)}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:${FONT};">${esc(cta.label)}</a>
        </td>
      </tr>
    </table>`;
}

function renderFootnote(text: string | undefined): string {
  if (!text) return "";
  return `<p style="margin:14px 0 0;padding-top:14px;border-top:1px solid ${C.divider};font-size:13px;line-height:1.5;color:${C.textMuted};">${linkify(esc(text))}</p>`;
}

function renderPreheader(text: string | undefined): string {
  if (!text) return "";
  // Standard hidden-preheader trick: visible text but height/opacity hidden
  // and the &zwnj; padding pushes Gmail's "remaining" preview off-screen.
  return `<div style="display:none;visibility:hidden;mso-hide:all;font-size:1px;color:${C.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(text)}${"&zwnj;&nbsp;".repeat(120)}</div>`;
}

export function renderEmail(p: EmailPayload): { html: string; text: string } {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>QuizSpark</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:${FONT};color:${C.text};-webkit-font-smoothing:antialiased;">
  ${renderPreheader(p.preheader)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${C.card};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:${C.brand};padding:22px 32px;border-bottom:3px solid ${C.brandDark};">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;font-family:${FONT};">🌺 QuizSpark</h1>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.92);letter-spacing:0.08em;text-transform:uppercase;font-family:${FONT};">Aloha · adaptive math practice</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 24px;">
              <h2 style="margin:0 0 14px;font-size:19px;font-weight:600;line-height:1.35;color:${C.text};font-family:${FONT};">${esc(p.heading)}</h2>
              ${renderParagraphs(p.body)}
              ${renderCode(p.code)}
              ${renderItems(p.items)}
              ${renderCTA(p.cta)}
              ${renderFootnote(p.footnote)}
            </td>
          </tr>
          <tr>
            <td style="padding:14px 32px;border-top:1px solid ${C.divider};background:${C.footerBg};">
              <p style="margin:0;font-size:12px;color:${C.textMuted};font-family:${FONT};">🌴 Mahalo for being part of the QuizSpark 'ohana.</p>
              <p style="margin:4px 0 0;font-size:11px;color:${C.textFaint};font-family:${FONT};">You're receiving this because of activity on your account.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Plain-text fallback — same content, no markup. Used by clients that
  // block HTML and as the multipart/alternative text part so deliverability
  // doesn't take a hit.
  const lines: string[] = [];
  lines.push(p.heading, "");
  const paras = Array.isArray(p.body) ? p.body : [p.body];
  for (const para of paras) {
    lines.push(para, "");
  }
  if (p.code) {
    lines.push(p.code, "");
  }
  if (p.items && p.items.length) {
    for (const it of p.items) lines.push(`- ${it}`);
    lines.push("");
  }
  if (p.cta) lines.push(`${p.cta.label}: ${p.cta.url}`, "");
  if (p.footnote) lines.push(p.footnote);
  // No leading "QuizSpark" header in the text — the From address +
  // signature line already convey it without making the body feel boxed-in.
  const text = lines.join("\n").trimEnd();

  return { html, text };
}
