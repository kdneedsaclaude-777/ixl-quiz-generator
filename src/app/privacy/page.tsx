import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How QuizSpark collects, uses, and protects your family's data.",
};

const UPDATED = "June 26, 2026";
const CONTACT = "admin@conceptmastery.ca";

// NOTE: This is an app-specific DRAFT to give the client's legal counsel a
// concrete starting point. It must be reviewed and approved by a lawyer
// (especially for COPPA / children's-data obligations) before launch.
export default function PrivacyPage() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="font-display text-4xl leading-tight tracking-tight text-slate-900 dark:text-slate-100">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: {UPDATED}</p>
      </header>

      <Section title="Who we are">
        <P>
          QuizSpark is an adaptive math-practice app for Grades 1–8, operated by Concept Mastery
          (&ldquo;we&rdquo;, &ldquo;us&rdquo;). This policy explains what we collect, why, and the choices
          you have. Questions? Email <a className="link" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </P>
      </Section>

      <Section title="A note about children">
        <P>
          QuizSpark is designed to be used by children under the supervision of a parent or guardian.
          A parent creates and controls the account, chooses which children are added, and can review
          or delete their data at any time. We do not knowingly let children create their own accounts
          without a parent or an authorized educator setting them up, and we never serve behavioral
          advertising to children or sell children&rsquo;s personal information.
        </P>
      </Section>

      <Section title="What we collect">
        <List
          items={[
            "Parent/guardian account: name, email address, hashed password, and (optionally) a phone number you choose to verify.",
            "Child profile: the child's first name (or nickname), grade level, and the topics you enable for them.",
            "Learning activity: quizzes generated, answers, scores, progress, streaks, XP, and badges.",
            "Payment data: if you subscribe, billing is handled by Stripe. We receive a payment confirmation and subscription status — we never see or store your full card number.",
            "Technical data: basic logs needed to run the service securely (e.g. request metadata for rate-limiting and error diagnostics).",
          ]}
        />
      </Section>

      <Section title="How we use it">
        <List
          items={[
            "To run the core service: generate quizzes, adapt difficulty, and show progress.",
            "To manage your account and subscription, and to send transactional and (opt-in) notification emails such as progress digests and streak reminders.",
            "To keep the service secure and reliable (rate-limiting, abuse prevention, debugging).",
            "We do not use children's data for advertising, and we do not sell personal information.",
          ]}
        />
      </Section>

      <Section title="Who we share it with (service providers)">
        <P>We use a small number of trusted processors who handle data only to provide their service to us:</P>
        <List
          items={[
            "Stripe — payment processing and subscription management.",
            "Our email provider (SMTP/Resend) — to deliver account and notification emails.",
            "Our hosting and database provider — to run the application.",
            "AI processing — when an administrator uses the PDF-to-questions generator, the document text is sent to our AI provider (Anthropic) to draft questions. This admin feature is not used to process children's personal information.",
          ]}
        />
      </Section>

      <Section title="Data retention & deletion">
        <P>
          We keep your data for as long as your account is active. You can delete a child profile or
          your whole account at any time from your account settings, or by emailing{" "}
          <a className="link" href={`mailto:${CONTACT}`}>{CONTACT}</a>. On deletion we remove or anonymize
          personal data, except where we must retain limited records (e.g. payment receipts) to meet
          legal and accounting obligations.
        </P>
      </Section>

      <Section title="Your choices & rights">
        <List
          items={[
            "Access, correct, or delete your and your children's data via account settings or by contacting us.",
            "Turn notification emails on or off in your notification settings.",
            "Withdraw consent at any time by deleting the account.",
          ]}
        />
      </Section>

      <Section title="Security">
        <P>
          Data is encrypted in transit (HTTPS), passwords are stored only as salted hashes, and access
          to production data is restricted. No system is perfectly secure, but we take reasonable,
          industry-standard measures to protect your information.
        </P>
      </Section>

      <Section title="Changes to this policy">
        <P>
          We&rsquo;ll update this page if our practices change and revise the &ldquo;Last updated&rdquo;
          date above. Material changes will be communicated by email where appropriate.
        </P>
      </Section>

      <Section title="Contact">
        <P>
          Concept Mastery — <a className="link" href={`mailto:${CONTACT}`}>{CONTACT}</a>. See also our{" "}
          <Link className="link" href="/terms">Terms of Service</Link>.
        </P>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      {children}
    </section>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{children}</p>;
}
function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      {items.map((it) => (
        <li key={it}>{it}</li>
      ))}
    </ul>
  );
}
