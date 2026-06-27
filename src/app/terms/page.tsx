import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using QuizSpark.",
};

const UPDATED = "June 26, 2026";
const CONTACT = "admin@conceptmastery.ca";

// NOTE: App-specific DRAFT for the client's legal counsel to review and approve
// before launch. Not a substitute for legal advice.
export default function TermsPage() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="font-display text-4xl leading-tight tracking-tight text-slate-900 dark:text-slate-100">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: {UPDATED}</p>
      </header>

      <Section title="1. Acceptance">
        <P>
          By creating an account or using QuizSpark (the &ldquo;Service&rdquo;), operated by Concept
          Mastery, you agree to these Terms and to our{" "}
          <Link className="link" href="/privacy">Privacy Policy</Link>. If you are using the Service on
          behalf of a child, you confirm you are their parent or legal guardian (or an authorized
          educator) and consent to their use.
        </P>
      </Section>

      <Section title="2. Accounts">
        <P>
          You are responsible for keeping your login credentials secure and for activity under your
          account. Provide accurate information and keep it up to date. We may suspend accounts that
          violate these Terms or that we reasonably believe are being misused.
        </P>
      </Section>

      <Section title="3. Subscriptions & billing">
        <List
          items={[
            "QuizSpark offers a free tier and a paid plan, QuizSpark Plus ($5/month, or an annual option where available).",
            "Paid subscriptions are billed through Stripe and renew automatically each billing period until cancelled.",
            "You can cancel anytime; Plus features remain active until the end of the current paid period. We don't provide pro-rated refunds for partial periods except where required by law.",
            "Prices and features may change; we'll give reasonable notice of material changes to paid plans.",
            "If a free trial is offered, you'll be charged when it ends unless you cancel beforehand.",
          ]}
        />
      </Section>

      <Section title="4. Acceptable use">
        <P>You agree not to:</P>
        <List
          items={[
            "Misuse the Service, attempt to break its security, or access data that isn't yours.",
            "Resell, copy, or redistribute the Service or its content without permission.",
            "Upload unlawful, harmful, or infringing content through any import or generation feature.",
          ]}
        />
      </Section>

      <Section title="5. Content & curriculum">
        <P>
          Quiz content is provided for educational practice. Skill references align to publicly
          available curriculum taxonomies; those names and standards belong to their respective owners.
          You retain rights to content you upload; you grant us the limited rights needed to process it
          to provide the Service.
        </P>
      </Section>

      <Section title="6. Disclaimers">
        <P>
          The Service is provided &ldquo;as is&rdquo; without warranties of any kind. We don&rsquo;t
          guarantee specific learning outcomes, uninterrupted availability, or that content is free of
          errors.
        </P>
      </Section>

      <Section title="7. Limitation of liability">
        <P>
          To the maximum extent permitted by law, Concept Mastery is not liable for indirect,
          incidental, or consequential damages. Our total liability for any claim relating to the
          Service is limited to the amount you paid us in the 12 months before the claim.
        </P>
      </Section>

      <Section title="8. Termination">
        <P>
          You may stop using the Service and delete your account at any time. We may suspend or
          terminate access for violations of these Terms. Sections that by their nature should survive
          termination (e.g. disclaimers, liability limits) will survive.
        </P>
      </Section>

      <Section title="9. Governing law">
        <P>
          These Terms are governed by the laws of the Province of Ontario and the federal laws of
          Canada applicable there, without regard to conflict-of-laws rules.
        </P>
      </Section>

      <Section title="10. Changes & contact">
        <P>
          We may update these Terms; we&rsquo;ll revise the date above and, for material changes, notify
          you where appropriate. Questions? Email{" "}
          <a className="link" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
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
