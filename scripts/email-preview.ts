// One-shot preview script — renders sample emails to ~/Desktop so you can
// open them in a real browser and see exactly what recipients will see.
// Not wired anywhere; run with `npx tsx scripts/email-preview.ts`.

import { renderEmail, type EmailPayload } from "../src/lib/emailTemplate";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const outDir = join(homedir(), "Desktop", "cm-email-previews");
mkdirSync(outDir, { recursive: true });

const samples: { file: string; label: string; p: EmailPayload }[] = [
  {
    file: "01-welcome.html",
    label: "Welcome (organic signup)",
    p: {
      preheader: "Your parent account is ready — log in to get started.",
      heading: "Welcome, Jane Doe!",
      body: [
        "Hi Jane Doe,",
        "Welcome to Concept Mastery! Your parent account is ready to use.",
      ],
      cta: { label: "Log in", url: "http://192.168.2.10:3000/auth/login" },
      footnote: "If this wasn't you, reply to this email and we'll sort it out.",
    },
  },
  {
    file: "02-welcome-admin-created.html",
    label: "Welcome (admin-provisioned)",
    p: {
      preheader: "An admin set up your tutor account.",
      heading: "Welcome, Sam Carter!",
      body: [
        "Hi Sam Carter,",
        "Welcome to Concept Mastery! Your tutor account is ready to use.",
        "An administrator created this account for you. Your password was set during provisioning — ask them if you need it.",
      ],
      cta: { label: "Log in", url: "http://192.168.2.10:3000/auth/login" },
      footnote: "If this wasn't you, reply to this email and we'll sort it out.",
    },
  },
  {
    file: "03-quiz-completed-tutor.html",
    label: "Quiz completed → tutor",
    p: {
      preheader: "Ben scored 78% on Quiz #142.",
      heading: "Ben finished a quiz",
      body: "Your student Ben completed Quiz #142 with a score of 78%.",
      cta: { label: "Review the quiz", url: "http://192.168.2.10:3000/quiz/142/results" },
    },
  },
  {
    file: "04-tutor-assigned.html",
    label: "Tutor newly assigned",
    p: {
      preheader: "Ben (Grade 6) is now on your roster.",
      heading: "New student assigned: Ben",
      body: [
        "You've been assigned as the tutor for Ben (Grade 6).",
        "You'll get an email each time they finish a quiz.",
      ],
      cta: { label: "Open their dashboard", url: "http://192.168.2.10:3000/tutor/student/4" },
    },
  },
  {
    file: "05-password-changed.html",
    label: "Security: password changed",
    p: {
      preheader: "If this wasn't you, reset your password now.",
      heading: "Your password was changed",
      body: [
        "Hi Jane Doe,",
        "Your password was just changed. If this was you, you can safely ignore this email.",
        "If it wasn't you, reset your password right away using the button below.",
      ],
      cta: { label: "Reset password", url: "http://192.168.2.10:3000/auth/forgot-password" },
    },
  },
  {
    file: "06-weekly-tutor-digest.html",
    label: "Weekly tutor digest",
    p: {
      preheader: "This week's snapshot for your cohort.",
      heading: "This week's cohort snapshot",
      body: "Here's how your students did this week:",
      items: [
        "Ben (G6): 4 quiz(zes) this week, avg 78%",
        "Ben #2 (G2): 2 quiz(zes) this week, avg 92%",
      ],
      cta: { label: "Open your cohort", url: "http://192.168.2.10:3000/tutor/dashboard" },
    },
  },
  {
    file: "07-low-score-alert.html",
    label: "Low-score alert → parent",
    p: {
      preheader: "Below your alert threshold — a short follow-up could help.",
      heading: "Heads up about Ben",
      body: [
        "Ben scored 45% on Quiz #143, which is below your alert threshold.",
        "A little extra practice on the weak topics might help.",
      ],
      cta: { label: "View results", url: "http://192.168.2.10:3000/quiz/143/results" },
    },
  },
];

for (const s of samples) {
  const { html } = renderEmail(s.p);
  const path = join(outDir, s.file);
  writeFileSync(path, html);
  console.log(`✓ ${s.label.padEnd(34)} → ${path}`);
}
console.log(`\nOpen all: open "${outDir}"`);
