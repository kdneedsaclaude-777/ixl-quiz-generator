// Download links for a quiz. `worksheet` = blank questions; `report` =
// answers + score + explanations (only meaningful once completed). Plain
// anchors so the browser handles the file via Content-Disposition; the
// session cookie authorizes the request.

export default function ExportMenu({
  quizId,
  mode,
}: {
  quizId: number;
  mode: "worksheet" | "report";
}) {
  const base = `/api/quiz/${quizId}/export?mode=${mode}`;
  const link =
    "rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Download {mode === "report" ? "report" : "worksheet"}:
      </span>
      <a href={`${base}&format=pdf`} className={link}>
        PDF
      </a>
      <a href={`${base}&format=xlsx`} className={link}>
        Excel
      </a>
    </div>
  );
}
