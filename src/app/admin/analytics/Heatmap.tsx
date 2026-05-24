"use client";

export type HeatmapCell = { grade: number; letter: string; accuracy: number | null; attempts: number };

// Renders a grade × topic-letter heatmap. Each cell is colored red→amber→green
// by accuracy and shows the % on hover; tiny cells with attempts==0 stay grey.
export default function Heatmap({
  letters, cells,
}: {
  letters: string[];
  cells: HeatmapCell[];
}) {
  const byKey = new Map(cells.map((c) => [`${c.grade}-${c.letter}`, c]));
  const grades = [1, 2, 3, 4, 5, 6, 7, 8];

  if (letters.length === 0) {
    return <p className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-center text-sm text-slate-400">No quiz data yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800 p-3">
      <table className="text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left font-normal text-slate-400">Grade</th>
            {letters.map((l) => (
              <th key={l} className="px-1 py-1 text-center font-mono font-medium text-slate-300">{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grades.map((g) => (
            <tr key={g}>
              <td className="px-2 py-1 text-slate-300">G{g}</td>
              {letters.map((l) => {
                const cell = byKey.get(`${g}-${l}`);
                const tone = colorFor(cell?.accuracy ?? null);
                return (
                  <td key={l} className="p-0.5">
                    <div
                      className={`flex h-7 w-9 items-center justify-center rounded text-[10px] font-semibold ${tone}`}
                      title={cell && cell.attempts > 0 ? `G${g} · ${l}: ${cell.accuracy}% (${cell.attempts})` : `G${g} · ${l}: no data`}
                    >
                      {cell && cell.accuracy !== null ? `${cell.accuracy}` : ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
        <span>≥80%</span>
        <span className="h-3 w-4 rounded bg-emerald-500" />
        <span>50–79%</span>
        <span className="h-3 w-4 rounded bg-amber-500" />
        <span>&lt;50%</span>
        <span className="h-3 w-4 rounded bg-rose-500" />
        <span>no data</span>
        <span className="h-3 w-4 rounded bg-slate-700" />
      </div>
    </div>
  );
}

function colorFor(accuracy: number | null): string {
  if (accuracy === null) return "bg-slate-700 text-slate-500";
  if (accuracy >= 80) return "bg-emerald-500/80 text-white";
  if (accuracy >= 50) return "bg-amber-500/80 text-slate-900";
  return "bg-rose-500/80 text-white";
}
