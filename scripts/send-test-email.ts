// One-shot test: send the "Welcome" email to a real inbox via whatever
// channel .env has wired up (Resend, then SMTP, then Ethereal fallback).
// Run with `npx tsx scripts/send-test-email.ts <recipient@example.com>`.
// Defaults to kiaanpragya99@gmail.com so the live demo works `npx tsx …`
// with no args.

// Run with: `npx tsx --env-file=.env scripts/send-test-email.ts [to]`
// The --env-file flag is built into Node 20.6+; no dotenv dep needed.
import { sendEmail, isRealEmailConfigured } from "../src/lib/email";
import { renderEmail } from "../src/lib/emailTemplate";

async function main() {
  const to = process.argv[2] ?? "kiaanpragya99@gmail.com";

  console.log(`[test] sending to: ${to}`);
  console.log(
    `[test] channel: ${
      process.env.RESEND_API_KEY
        ? "Resend (RESEND_API_KEY present)"
        : process.env.SMTP_HOST
        ? `SMTP (host=${process.env.SMTP_HOST})`
        : "Ethereal dev fallback — won't reach a real inbox"
    }`,
  );
  console.log(`[test] isRealEmailConfigured() → ${isRealEmailConfigured()}`);

  const { html, text } = renderEmail({
    preheader: "This is a live test of the Concept Mastery email pipeline.",
    heading: "Welcome to Concept Mastery!",
    body: [
      "Hi there,",
      "This is a test email rendered through the same HTML template that powers welcome, digest, security, and quiz-completion notifications.",
      "If it looks good in your inbox, the pipeline is wired correctly and every notification will arrive with the same branding.",
    ],
    cta: { label: "Open the app", url: "http://192.168.2.10:3000/auth/login" },
    footnote:
      "Sent from scripts/send-test-email.ts. Reply to this email to confirm round-trip works.",
  });

  const result = await sendEmail({
    to,
    subject: "Concept Mastery — HTML email pipeline test",
    text,
    html,
  });

  if (result.previewUrl) {
    console.log(`[test] Ethereal preview: ${result.previewUrl}`);
    console.log(`[test] (This means the email did NOT reach ${to} — fallback channel.)`);
  } else {
    console.log(`[test] ✓ handed off to delivery channel — check ${to} inbox.`);
  }
}

main().catch((err) => {
  console.error("[test] failed:", err);
  process.exit(1);
});
