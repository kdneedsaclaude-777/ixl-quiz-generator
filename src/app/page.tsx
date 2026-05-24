import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isMaintenanceModeOn } from "@/lib/maintenance";

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
      <header className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">IXL Quiz App</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Adaptive math practice for Grades 1–8, aligned to the IXL Ontario curriculum.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Cta
          href="/auth/login"
          accent="indigo"
          eyebrow="For parents"
          title="Parent login"
          body="Sign in to manage your children, set practice rules, and see their progress."
        />
        <Cta
          href="/auth/login"
          accent="amber"
          eyebrow="For kids"
          title="Student log in"
          body="Have your own login? Use it here. (No login? Ask a parent to add you from their dashboard.)"
        />
      </section>

      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        New here?{" "}
        <Link href="/auth/signup" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          Create a parent account
        </Link>
      </div>
    </main>
  );
}

function Cta({
  href, accent, eyebrow, title, body,
}: {
  href: string;
  accent: "indigo" | "amber";
  eyebrow: string;
  title: string;
  body: string;
}) {
  const tone = accent === "indigo"
    ? "border-indigo-200 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70"
    : "border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-950/70";
  return (
    <Link
      href={href}
      className={`block rounded-2xl border p-6 shadow-sm transition-colors ${tone}`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{eyebrow}</div>
      <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{body}</p>
      <p className="mt-3 text-sm font-semibold text-indigo-700 dark:text-indigo-300">Continue →</p>
    </Link>
  );
}
