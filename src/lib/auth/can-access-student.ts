import { prisma } from "@/lib/db";

// Shared cross-role visibility check for a single student:
//  - superadmin: any student
//  - orgadmin: students in their own org
//  - parent: their own children
//  - student: only themselves
//  - tutor: students assigned to them
export async function canAccessStudent(
  userId: string,
  role: string,
  orgId: string | null,
  studentId: number,
): Promise<boolean> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, orgId: true, parentId: true, userId: true },
  });
  if (!student) return false;
  if (role === "superadmin") return true;
  if (role === "orgadmin") return student.orgId !== null && student.orgId === orgId;
  if (role === "parent") return student.parentId === userId;
  if (role === "student") return student.userId === userId;
  if (role === "tutor") {
    const link = await prisma.tutorAssignment.findUnique({
      where: { tutorId_studentId: { tutorId: userId, studentId: student.id } },
      select: { id: true },
    });
    return Boolean(link);
  }
  return false;
}
