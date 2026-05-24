// Full-progress data portability download for a student. Plain anchors so the
// browser handles the file via Content-Disposition; the session cookie
// authorizes the request (scoped server-side by role).

export default function DataExportMenu({ studentId }: { studentId: number }) {
  const base = `/api/progress/export?studentId=${studentId}`;
  const link =
    "rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Download all progress data:
      </span>
      <a href={`${base}&format=json`} className={link}>
        JSON
      </a>
      <a href={`${base}&format=csv`} className={link}>
        CSV
      </a>
    </div>
  );
}
