import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import AdminImportClient from "./AdminImportClient";

export const metadata = { title: "Import questions — Admin" };

// Superadmin tool: generate questions from a PDF (embedded generator) and turn
// them into a real practice quiz for any student. Superadmin-only for now.
export default async function AdminImportPage() {
  const admin = await requireAdminSession();
  if (admin.role !== "superadmin") redirect("/admin/dashboard");

  const students = await prisma.student.findMany({
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, grade: true, parent: { select: { name: true } } },
  });

  return (
    <AdminImportClient
      students={students.map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        parentName: s.parent?.name ?? null,
      }))}
    />
  );
}
