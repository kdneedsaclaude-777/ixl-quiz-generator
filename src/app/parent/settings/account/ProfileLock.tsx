import { enableProfileLock, resendProfilePin, disableProfileLock } from "./lockActions";

// Parental profile lock. Server component — the buttons post directly to the
// lock actions (which email the PIN and revalidate this page).
export default function ProfileLock({ locked }: { locked: boolean }) {
  return (
    <section className="cm-card p-6 dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">Child profile lock</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Require a 4-digit PIN to switch profiles or return to the parent app on a shared device —
        so a child can&apos;t reach a sibling&apos;s profile or your account. The PIN is emailed to you.
      </p>

      {locked ? (
        <div className="mt-4 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-cm-mint-soft px-3 py-1 text-xs font-bold text-emerald-800">
            ● Lock is ON
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The PIN was sent to your email. Use &ldquo;Email me the PIN again&rdquo; if you need it resent (this issues a new PIN).
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={resendProfilePin}>
              <button type="submit" className="cm-btn ghost">Email me the PIN again</button>
            </form>
            <form action={disableProfileLock}>
              <button type="submit" className="cm-btn ghost" style={{ color: "var(--cm-red)" }}>Turn off lock</button>
            </form>
          </div>
        </div>
      ) : (
        <form action={enableProfileLock} className="mt-4">
          <button type="submit" className="cm-btn primary">Turn on profile lock</button>
        </form>
      )}
    </section>
  );
}
