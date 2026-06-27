import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import ContentManager, { type ContentGroup } from "./ContentManager";

export const metadata = { title: "Content management" };

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  const _admin = await requireAdminSession();
  if (_admin.role !== "superadmin") redirect("/admin/dashboard");
  const { grade: gradeParam } = await searchParams;
  const grade = /^[1-8]$/.test(gradeParam ?? "") ? parseInt(gradeParam!, 10) : 1;

  const groups = await prisma.topicGroup.findMany({
    where: { gradeLevel: grade },
    orderBy: { letter: "asc" },
    include: {
      skills: { orderBy: { number: "asc" } },
      _count: { select: { skills: true } },
    },
  });

  const data: ContentGroup[] = groups.map((g) => ({
    id: g.id,
    letter: g.letter,
    name: g.name,
    active: g.active,
    skillCount: g._count.skills,
    skills: g.skills.map((s) => ({ id: s.id, code: s.code, name: s.name, active: s.active })),
  }));

  return (
    <main className="space-y-6 text-[color:var(--shell-text)]">
      <header>
        <div className="text-xs font-semibold tracking-wide text-[color:var(--shell-muted)]">CURRICULUM</div>
        <h1 className="font-display mt-1 text-4xl leading-none text-white">Content management</h1>
        <p className="mt-1.5 text-sm text-[color:var(--shell-muted)]">
          Toggle topic groups and skills on or off. Inactive topics are hidden from onboarding and quiz generation.
        </p>
      </header>
      <ContentManager grade={grade} groups={data} />
    </main>
  );
}
