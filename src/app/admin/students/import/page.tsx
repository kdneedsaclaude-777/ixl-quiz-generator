import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/admin";
import BulkImport from "./BulkImport";

export const metadata = { title: "Bulk import students — QuizSpark" };

export default async function BulkImportPage() {
  await requireAdminSession();
  return (
    <main className="space-y-4 text-[color:var(--shell-text)]">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-wide text-[color:var(--shell-muted)]">ADD STUDENT</div>
          <h1 className="font-display mt-1 text-4xl leading-none text-white">Bulk import students</h1>
          <p className="mt-1.5 text-sm text-[color:var(--shell-muted)]">
            Upload or paste a CSV to onboard many students at once. Preview before committing.
          </p>
        </div>
        <Link href="/admin/students" className="text-sm text-[#A5B4FC] hover:underline">← Back to students</Link>
      </header>
      <BulkImport />
    </main>
  );
}
