import Link from "next/link";
import { prisma } from "@/lib/db";
import { resolveActiveStudent } from "@/lib/active-child";
import PhoneForm from "@/app/parent/settings/account/PhoneForm";

export const metadata = { title: "My Account" };

// A student-facing account page. The /parent/settings/account route requires
// a parent session, so before this page existed a student logged into their
// own account had no UI to manage their phone or change their password.
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

  return (
    <main className="mx-auto max-w-md space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-amber-900 dark:text-amber-100">My Account</h1>
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
          Signed in as <span className="font-semibold">{user?.email ?? child.name}</span>
        </p>
      </header>

      <section className="rounded-2xl border-2 border-amber-200 bg-white p-5 dark:border-amber-800/50 dark:bg-amber-950/20">
        <h2 className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
          Phone (optional)
        </h2>
        <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
          Add a verified phone number as a second contact channel.
        </p>
        <PhoneForm
          initialPhone={user?.phone ?? null}
          initialVerified={Boolean(user?.phoneVerified)}
        />
      </section>

      <section className="rounded-2xl border-2 border-amber-200 bg-white p-5 dark:border-amber-800/50 dark:bg-amber-950/20">
        <h2 className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
          Password
        </h2>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
          To change your password, use the password-reset link:
        </p>
        <Link
          href="/auth/forgot-password"
          className="mt-3 inline-block rounded-full bg-amber-500 px-4 py-1.5 text-sm font-bold text-white hover:bg-amber-600"
        >
          Reset my password →
        </Link>
      </section>

      <Link
        href="/child/home"
        className="inline-block text-sm font-semibold text-amber-700 underline dark:text-amber-300"
      >
        ← Back home
      </Link>
    </main>
  );
}
