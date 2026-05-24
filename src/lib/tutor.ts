import { prisma } from "@/lib/db";

export type TutorStudentRow = {
  id: number;
  name: string;
  grade: number;
  difficulty: number;
  quizzesCompleted: number;
  avgScore: number | null;
  lastActive: string | null;
};

// All students assigned to a tutor (via TutorAssignment), with rollup stats.
export async function loadTutorStudents(tutorId: string): Promise<TutorStudentRow[]> {
  const assignments = await prisma.tutorAssignment.findMany({
    where: { tutorId },
    include: {
      student: {
        include: {
          quizzes: {
            where: { status: "completed" },
            select: { score: true, completedAt: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return assignments.map((a) => {
    const completed = a.student.quizzes.filter((q) => typeof q.score === "number");
    const avg = completed.length
      ? Math.round(completed.reduce((acc, q) => acc + (q.score ?? 0), 0) / completed.length)
      : null;
    const last = completed
      .map((q) => q.completedAt)
      .filter((d): d is Date => Boolean(d))
      .sort((x, y) => y.getTime() - x.getTime())[0];
    return {
      id: a.student.id,
      name: a.student.name,
      grade: a.student.grade,
      difficulty: a.student.currentDifficulty,
      quizzesCompleted: completed.length,
      avgScore: avg,
      lastActive: last ? last.toISOString() : null,
    };
  });
}

// Guard: returns the student only if this tutor is assigned to them.
export async function tutorOwnsStudent(tutorId: string, studentId: number) {
  const link = await prisma.tutorAssignment.findUnique({
    where: { tutorId_studentId: { tutorId, studentId } },
  });
  if (!link) return null;
  return prisma.student.findUnique({ where: { id: studentId } });
}
