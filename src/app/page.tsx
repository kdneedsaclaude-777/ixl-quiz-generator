import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isMaintenanceModeOn } from "@/lib/maintenance";
import { Logo } from "@/components/Logo";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const role = session.user.role;
    if (role === "superadmin" || role === "orgadmin") redirect("/admin/dashboard");
    if (await isMaintenanceModeOn()) redirect("/maintenance");
    if (role === "tutor") redirect("/tutor/dashboard");
    if (role === "student") redirect("/child/home");
    redirect("/parent/dashboard");
  }
  if (await isMaintenanceModeOn()) redirect("/maintenance");

  return (
    <main className="space-y-10">
      {/* Hero — serif display, matching the design's auth/onboarding headers. */}
      <header className="text-center">
        <div className="flex justify-center">
          <Logo size={40} tagline />
        </div>
        <h1 className="font-display mt-8 text-5xl leading-[1.05] tracking-tight text-slate-900 dark:text-slate-100">
          Master math, one quiz at a time.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-slate-500 dark:text-slate-400">
          Adaptive practice for Grades 1–8, aligned to the IXL Ontario curriculum.
          Built for families, tutors, and schools.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Cta
          href="/auth/login"
          accent="indigo"
          emoji="👪"
          eyebrow="For parents & tutors"
          title="Sign in"
          body="Manage children, build adaptive quizzes, set practice rules, and track progress."
        />
        <Cta
          href="/auth/login"
          accent="coral"
          emoji="🦊"
          eyebrow="For students"
          title="I'm a student"
          body="Have your own login? Jump in. No login yet? Ask a parent to invite you."
        />
      </section>

      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        New family?{" "}
        <Link href="/auth/signup" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          Create a parent account
        </Link>
      </div>
    </main>
  );
}

function Cta({
  href, accent, emoji, eyebrow, title, body,
}: {
  href: string;
  accent: "indigo" | "coral";
  emoji: string;
  eyebrow: string;
  title: string;
  body: string;
}) {
  const tone =
    accent === "indigo"
      ? "border-indigo-200 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70"
      : "border-[#F4DCDC] bg-[#FBF1F1] hover:bg-[#F8E8E8] dark:border-rose-900 dark:bg-rose-950/30 dark:hover:bg-rose-950/50";
  const chip =
    accent === "indigo" ? "bg-indigo-500" : "bg-cm-red";
  return (
    <Link
      href={href}
      className={`block rounded-2xl border p-6 shadow-card transition-colors ${tone}`}
    >
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${chip}`}>{emoji}</span>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {eyebrow}
        </div>
      </div>
      <h2 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-slate-100">{title}</h2>
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{body}</p>
      <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
        Continue <span aria-hidden>→</span>
      </p>
    </Link>
  );
}
