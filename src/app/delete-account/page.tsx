import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Delete your account",
  description: "How to delete your QuizSpark account and what data is removed.",
};

const CONTACT = "admin@conceptmastery.ca";

// Public account-deletion instructions — required by Google Play's Data Safety
// section. Reachable without logging in so Play reviewers and users can read it.
export default function DeleteAccountPage() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="font-display text-4xl leading-tight tracking-tight text-slate-900 dark:text-slate-100">
          Delete your QuizSpark account
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          QuizSpark, by Concept Mastery
        </p>
      </header>

      <Section title="Option 1 — Delete it yourself in the app">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <li>Sign in to QuizSpark.</li>
          <li>Go to <span className="font-semibold">Account</span> (under settings).</li>
          <li>Scroll to <span className="font-semibold">Delete account</span>.</li>
          <li>Type <span className="font-mono font-semibold">DELETE</span> to confirm, then press the button.</li>
        </ol>
        <P>Your account is deactivated and anonymized right away.</P>
      </Section>

      <Section title="Option 2 — Ask us to delete it">
        <P>
          If you can&rsquo;t sign in, email{" "}
          <a className="link" href={`mailto:${CONTACT}?subject=Delete my account`}>{CONTACT}</a>{" "}
          from the email address on your account with the subject &ldquo;Delete my account.&rdquo;
          We&rsquo;ll process the request within 30 days.
        </P>
      </Section>

      <Section title="What gets deleted">
        <List
          items={[
            "Your personal information — name, email address, and password — is removed or anonymized immediately.",
            "Your account is deactivated and can no longer be signed in to.",
            "Your children's profiles are unlinked from your account.",
          ]}
        />
      </Section>

      <Section title="What may be kept (and for how long)">
        <List
          items={[
            "Children's practice/quiz history may be retained in anonymized form (no longer linked to you) so learning records aren't lost.",
            "Billing/payment receipts are kept only as long as required for legal and accounting purposes.",
            "Anonymized, non-identifying records may be retained for analytics.",
          ]}
        />
      </Section>

      <Section title="Questions">
        <P>
          Email <a className="link" href={`mailto:${CONTACT}`}>{CONTACT}</a>. See also our{" "}
          <Link className="link" href="/privacy">Privacy Policy</Link>.
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
