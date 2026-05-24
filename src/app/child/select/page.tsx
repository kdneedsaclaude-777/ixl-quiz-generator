import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Avatar from "@/components/Avatar";
import { selectChild } from "../actions";

export default async function ChildSelectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  // A student logged into their own account has no profile to "pick" — send
  // them straight to practice rather than bouncing to the login screen.
  if (session.user.role === "student") redirect("/child/home");
  if (session.user.role !== "parent") redirect("/auth/login");
  const { error } = await searchParams;

  const children = await prisma.student.findMany({
    where: { parentId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, grade: true },
  });

  return (
    <main className="space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">Who&apos;s practising?</h1>
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">Tap your name to start.</p>
      </header>

      {error && (
        <p className="rounded bg-rose-50 px-3 py-2 text-center text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          We couldn&apos;t open that profile. Try another.
        </p>
      )}

      {children.length === 0 ? (
        <p className="rounded-lg border border-dashed border-amber-300 bg-white p-6 text-center text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100">
          Your parent hasn&apos;t added any children yet. Ask them to add a profile from the parent dashboard.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {children.map((c) => (
            <li key={c.id}>
              <form action={selectChild}>
                <input type="hidden" name="childId" value={c.id} />
                <button
                  type="submit"
                  className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5 hover:border-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:border-amber-700/50 dark:bg-amber-950/30 dark:hover:border-amber-500 dark:focus-visible:ring-offset-slate-900"
                >
                  <Avatar name={c.name} size={72} />
                  <div className="text-xl font-bold text-amber-900 dark:text-amber-100">{c.name}</div>
                  <div className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-100">Grade {c.grade}</div>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
