import { unlockProfile, resendPinFromUnlock } from "../actions";

export const metadata = { title: "Enter PIN — QuizSpark" };

// PIN gate shown when a parent (with a profile-lock PIN) tries to switch
// profiles or leave a child's session. Middleware routes locked /parent/* and
// /child/select here; on the correct PIN we proceed to `next`.
export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; sent?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") ? sp.next : "/parent/dashboard";
  const isExit = next.startsWith("/parent");

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center px-3">
      <div className="cm-card p-7 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl text-2xl" style={{ background: "var(--cm-blue-50)" }}>
          🔒
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-slate-900">Enter parent PIN</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isExit ? "Enter the PIN to return to the parent app." : "Enter the PIN to switch profiles."}
        </p>

        {sp.sent && (
          <p className="mt-4 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--cm-mint-soft)", color: "#047857" }}>
            A new PIN was emailed to the parent's address.
          </p>
        )}
        {sp.error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">That PIN wasn't right. Try again.</p>
        )}

        <form action={unlockProfile} className="mt-5 space-y-3">
          <input type="hidden" name="next" value={next} />
          <input
            name="pin"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]*"
            maxLength={4}
            required
            aria-label="4-digit PIN"
            placeholder="••••"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-center text-2xl tracking-[0.5em] text-slate-900 outline-none focus:border-cm-blue"
          />
          <button type="submit" className="cm-btn primary lg w-full justify-center">Unlock</button>
        </form>

        <form action={resendPinFromUnlock} className="mt-3">
          <input type="hidden" name="next" value={next} />
          <button type="submit" className="text-xs font-medium text-cm-blue hover:underline">
            Forgot the PIN? Email it to the parent
          </button>
        </form>
      </div>
    </main>
  );
}
