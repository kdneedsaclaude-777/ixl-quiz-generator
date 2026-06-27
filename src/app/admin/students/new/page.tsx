import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/admin";

export const metadata = { title: "Add student — QuizSpark" };

// Step 1 of adding a student: pick the billing model. Mirrors the client's
// Teachworks-style chooser. Family & Child → a family (billed together);
// Independent → an adult/self-billed student.
export default async function AddStudentChooser() {
  await requireAdminSession();
  return (
    <main className="max-w-3xl space-y-5 text-[color:var(--shell-text)]">
      <header>
        <div className="text-xs font-semibold tracking-wide text-[color:var(--shell-muted)]">ADD STUDENT</div>
        <h1 className="font-display mt-1 text-4xl leading-none text-white">
          Which type of student?
        </h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/students/new/family"
          className="group rounded-2xl border p-5 transition-colors hover:border-[#A5B4FC]"
          style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="cm-pill indigo" style={{ height: 24 }}>Family</span>
            <span aria-hidden className="text-[#A5B4FC]">❯</span>
          </div>
          <h2 className="font-display mt-3 text-2xl text-white">Family &amp; Child Student</h2>
          <p className="mt-1.5 text-sm text-[color:var(--shell-muted)]">
            Select this if a student belongs to a family and the family will be billed.
          </p>
        </Link>

        <Link
          href="/admin/students/new/independent"
          className="group rounded-2xl border p-5 transition-colors hover:border-[#A5B4FC]"
          style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="cm-pill mint" style={{ height: 24 }}>Independent</span>
            <span aria-hidden className="text-[#A5B4FC]">❯</span>
          </div>
          <h2 className="font-display mt-3 text-2xl text-white">Independent Student</h2>
          <p className="mt-1.5 text-sm text-[color:var(--shell-muted)]">
            Select this if a student will be billed directly.
          </p>
        </Link>
      </div>

      <div className="pt-1 text-sm">
        <Link href="/admin/students" className="text-[#A5B4FC] hover:underline">← Back to students</Link>
      </div>
    </main>
  );
}
