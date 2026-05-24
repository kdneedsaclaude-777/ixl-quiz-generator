import { requireAdminSession, adminScope } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import StudentsTable, { type StudentRow, type TutorOption, type ParentOption } from "./StudentsTable";

export const metadata = { title: "Student management" };
const PAGE_SIZE = 10;

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; grade?: string; difficulty?: string }>;
}) {
  const admin = await requireAdminSession();
  const { page: pageRaw, q, grade, difficulty } = await searchParams;
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: Prisma.StudentWhereInput = { ...adminScope(admin) };
  if (q && q.trim()) {
    where.OR = [
      { name: { contains: q.trim() } },
      { parent: { OR: [{ name: { contains: q.trim() } }, { email: { contains: q.trim() } }] } },
    ];
  }
  if (grade && /^[1-8]$/.test(grade)) where.grade = parseInt(grade, 10);
  if (difficulty && /^[1-5]$/.test(difficulty)) where.currentDifficulty = parseInt(difficulty, 10);

  const [total, students, tutors, parents] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        parent: { select: { id: true, name: true, email: true } },
        quizzes: { select: { id: true, status: true, score: true, completedAt: true } },
        tutorAssignments: { include: { tutor: { select: { id: true, name: true } } } },
      },
    }),
    // Tutors selectable for assignment (org-scoped for org-admins).
    prisma.user.findMany({
      where: { role: "tutor", deletedAt: null, ...adminScope(admin) },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    // Parents selectable as the new student's owner (org-scoped).
    prisma.user.findMany({
      where: { role: "parent", deletedAt: null, ...adminScope(admin) },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const rows: StudentRow[] = students.map((s) => {
    const completed = s.quizzes.filter((q) => q.status === "completed" && typeof q.score === "number");
    const avg = completed.length
      ? Math.round(completed.reduce((acc, q) => acc + (q.score ?? 0), 0) / completed.length)
      : null;
    const firstTutor = s.tutorAssignments[0]?.tutor;
    return {
      id: s.id,
      name: s.name,
      grade: s.grade,
      difficulty: s.currentDifficulty,
      parentName: s.parent?.name ?? "—",
      parentEmail: s.parent?.email ?? "",
      quizzesCount: s.quizzes.length,
      avgScore: avg,
      lastActive: completed[0]?.completedAt?.toISOString() ?? null,
      tutorId: firstTutor?.id ?? null,
      tutorName: firstTutor?.name ?? null,
    };
  });

  const tutorOptions: TutorOption[] = tutors.map((t) => ({ id: t.id, name: t.name, email: t.email }));
  const parentOptions: ParentOption[] = parents.map((p) => ({ id: p.id, name: p.name, email: p.email }));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Student management</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{total} student{total === 1 ? "" : "s"}.</p>
      </header>
      <StudentsTable
        rows={rows}
        tutors={tutorOptions}
        parents={parentOptions}
        page={page}
        totalPages={totalPages}
        query={q ?? ""}
        grade={grade ?? "all"}
        difficulty={difficulty ?? "all"}
      />
    </main>
  );
}
