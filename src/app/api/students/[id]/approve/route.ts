import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionForApi } from "@/lib/auth/server";
import { canAccessStudent } from "@/lib/auth/can-access-student";
import { auditLog } from "@/lib/audit";

// POST /api/students/[id]/approve  Body: { approved?: boolean }
//
// Approves (or revokes) a student's access. This is the gate that lets a
// self-claimed student start practising. Allowed for an admin (org-scoped)
// or a tutor assigned to the student — reuses canAccessStudent so the
// visibility rules and the approval rights stay in one place.
type Body = { approved?: boolean };

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await getSessionForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const studentId = parseInt(id, 10);
  if (!Number.isFinite(studentId)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  // Only tutors + admins may approve. Parents/students cannot self-approve.
  const role = auth.user.role;
  if (!["tutor", "orgadmin", "superadmin"].includes(role)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  const allowed = await canAccessStudent(auth.user.userId, role, auth.user.orgId, studentId);
  if (!allowed) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const approved = (await req.json().catch(() => ({} as Body))).approved !== false;
  await prisma.student.update({ where: { id: studentId }, data: { tutorApproved: approved } });

  await auditLog({
    actorId: auth.user.userId,
    action: approved ? "approve_student" : "revoke_student",
    targetType: "Student",
    targetId: String(studentId),
    metadata: { byRole: role },
  });

  return NextResponse.json({ ok: true, approved });
}
