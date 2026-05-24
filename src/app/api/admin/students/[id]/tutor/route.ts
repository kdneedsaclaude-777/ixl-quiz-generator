import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { auditLog } from "@/lib/audit";
import { notifyTutorAssigned } from "@/lib/notifications";

type Body = { tutorId?: string | null };

// Sets (or clears) the single tutor assigned to a student. Phase 5 keeps it
// to one tutor per student; the schema supports many via TutorAssignment so
// this replaces any existing assignment.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id: idParam } = await params;
  const studentId = parseInt(idParam, 10);
  if (!Number.isFinite(studentId)) {
    return NextResponse.json({ error: "Invalid student id." }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });
  // Org-admins can only touch students in their own org.
  if (auth.admin.role === "orgadmin" && student.orgId !== auth.admin.orgId) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const tutorId = body.tutorId ? String(body.tutorId) : null;

  if (tutorId) {
    const tutor = await prisma.user.findUnique({ where: { id: tutorId } });
    if (!tutor || tutor.role !== "tutor" || tutor.deletedAt) {
      return NextResponse.json({ error: "Invalid tutor." }, { status: 400 });
    }
    if (auth.admin.role === "orgadmin" && tutor.orgId !== auth.admin.orgId) {
      return NextResponse.json({ error: "Invalid tutor." }, { status: 400 });
    }
    if (student.orgId && tutor.orgId && student.orgId !== tutor.orgId) {
      return NextResponse.json({ error: "Tutor and student must be in the same org." }, { status: 400 });
    }
  }

  await prisma.$transaction([
    prisma.tutorAssignment.deleteMany({ where: { studentId } }),
    ...(tutorId
      ? [prisma.tutorAssignment.create({ data: { studentId, tutorId } })]
      : []),
  ]);

  await auditLog({
    actorId: auth.admin.userId,
    action: tutorId ? "assign_tutor" : "unassign_tutor",
    targetType: "Student",
    targetId: String(studentId),
    metadata: { tutorId },
  });

  // Only fire on assign — unassign is usually because someone left or got
  // re-routed and a "you've been unassigned" email is more noise than signal.
  if (tutorId) {
    await notifyTutorAssigned({ studentId });
  }

  return NextResponse.json({ ok: true });
}
