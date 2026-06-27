import Link from "next/link";
import { prisma } from "@/lib/db";
import { resolveActiveStudent } from "@/lib/active-child";
import { studentEmoji } from "@/lib/student-emoji";
import CMIcon from "@/components/CMIcon";
import PhoneForm from "@/app/parent/settings/account/PhoneForm";

export const metadata = { title: "Me — QuizSpark" };

// A student-facing account page — the "Me" tab. The /parent/settings/account
// route requires a parent session, so before this page existed a student
// logged into their own account had no UI to manage their phone or change
// their password. Restyled to the warm-kid system: an emoji-avatar profile
// header, then settings shown as cm-card rows.
export default async function ChildAccountPage() {
  const { student: child } = await resolveActiveStudent();
  // The phone fields live on the student's User row (not the Student row).
  const account = child
    ? await prisma.student.findUnique({
        where: { id: child.id },
        select: { account: { select: { email: true, phone: true, phoneVerified: true } } },
      })
    : null;
  const user = account?.account;
  const emoji = studentEmoji(child.id);

  return (
    <main className="space-y-5">
      {/* ── Profile header: big emoji avatar + name/grade ── */}
      <header className="cm-card overflow-hidden">
        <div
          className="relative px-5 pb-5 pt-8 text-center"
          style={{ background: "linear-gradient(160deg, var(--cm-coral-soft) 0%, #fff 75%)" }}
        >
          <div
            className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-white text-5xl shadow-sm"
            style={{ border: "3px solid var(--cm-coral)" }}
          >
            {emoji}
          </div>
          <h1 className="font-display mt-3 text-3xl leading-tight text-slate-900">
            {child.name}
          </h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="cm-pill coral">Grade {child.grade}</span>
            {user?.email && (
              <span className="cm-pill" title={user.email}>
                {user.email}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Phone setting row ── */}
      <section className="cm-card p-5">
        <div className="flex items-start gap-3">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
            style={{ background: "var(--cm-blue-50)" }}
            aria-hidden
          >
            <CMIcon name="bell" size={20} color="var(--cm-blue)" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-900">Phone 📱</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Add a verified phone number as a second contact channel.
            </p>
          </div>
        </div>
        <PhoneForm
          initialPhone={user?.phone ?? null}
          initialVerified={Boolean(user?.phoneVerified)}
        />
      </section>

      {/* ── Password setting row ── */}
      <section className="cm-card p-5">
        <div className="flex items-start gap-3">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
            style={{ background: "var(--cm-gold-soft)" }}
            aria-hidden
          >
            <CMIcon name="lock" size={20} color="var(--cm-gold)" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-900">Password 🔑</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              To change your password, use the password-reset link.
            </p>
            <Link href="/auth/forgot-password" className="cm-btn coral mt-3">
              Reset my password
              <CMIcon name="arrow" size={16} color="#fff" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
