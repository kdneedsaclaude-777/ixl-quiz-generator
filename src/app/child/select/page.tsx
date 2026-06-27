import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { studentEmoji } from "@/lib/student-emoji";
import { Logo } from "@/components/Logo";
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
    <main className="mx-auto w-full max-w-md px-1">
      <div className="flex justify-center pt-3">
        <Logo size={26} />
      </div>
      <h1 className="font-display mt-7 text-[34px] leading-tight text-slate-900">Who&apos;s playing?</h1>
      <p className="mt-1 text-sm text-slate-500">Tap your avatar to start.</p>

      {error && (
        <p className="mt-4 rounded-xl bg-cm-red-soft px-3 py-2 text-center text-sm" style={{ color: "#B43326" }}>
          We couldn&apos;t open that profile. Try another.
        </p>
      )}

      {children.length === 0 ? (
        <p className="mt-6 rounded-[18px] border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          No child profiles yet. Add one from the parent dashboard to begin.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-3">
          {children.map((c, i) => (
            <form key={c.id} action={selectChild}>
              <input type="hidden" name="childId" value={c.id} />
              <button
                type="submit"
                className="relative grid aspect-square w-full place-items-center rounded-[22px] bg-white text-[44px] shadow-card transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cm-red"
                style={{ border: i === 0 ? "3px solid var(--cm-coral)" : "1px solid var(--slate-200)" }}
              >
                {studentEmoji(c.id)}
                <span
                  className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11px] font-bold text-white"
                  style={{ background: "var(--cm-coral)" }}
                >
                  {c.name.split(" ")[0]} · G{c.grade}
                </span>
              </button>
            </form>
          ))}
        </div>
      )}
    </main>
  );
}
