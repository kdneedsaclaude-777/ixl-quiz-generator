// One-shot resend: the "Ben hasn't practised recently" absence email to
// both inboxes. Same template, same body — no role variation. Run with:
//   npx tsx --env-file=.env scripts/send-ben-absence.ts

import { sendEmail, buildAppUrl } from "../src/lib/email";
import { renderEmail } from "../src/lib/emailTemplate";

const recipients = [
  { email: "kiaanpragya99@gmail.com", name: "Kiaan" },
  { email: "pragyagupta99@gmail.com", name: "Pragya" },
];

async function main() {
  for (const r of recipients) {
    const { html, text } = renderEmail({
      preheader: "Ben hasn't completed a quiz in 7+ days.",
      heading: "Ben hasn't practised recently",
      body: [
        `Aloha ${r.name},`,
        `Ben hasn't completed a quiz in at least 7 day(s). A short session this evening keeps the streak alive!`,
        `Even 10 minutes makes a difference — the adaptive engine will pick exactly the skills he needs to brush up on.`,
      ],
      cta: { label: "Open your dashboard", url: buildAppUrl("/parent/dashboard") },
      footnote:
        "You're receiving this because you have inactivity alerts enabled. Change this anytime in Settings → Notifications.",
    });
    await sendEmail({
      to: r.email,
      subject: "Ben hasn't practised recently",
      text,
      html,
    });
    console.log(`✓ sent to ${r.email}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
