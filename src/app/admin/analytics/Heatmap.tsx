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
    return <p className="rounded-2xl border p-6 text-center text-sm text-[color:var(--shell-muted)]" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>No quiz data yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border p-3 text-[color:var(--shell-text)]" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
      <table className="text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left font-normal text-[color:var(--shell-muted)]">Grade</th>
            {letters.map((l) => (
              <th key={l} className="px-1 py-1 text-center font-mono font-medium text-[color:var(--shell-text)]">{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grades.map((g) => (
            <tr key={g}>
              <td className="px-2 py-1 text-[color:var(--shell-text)]">G{g}</td>
              {letters.map((l) => {
                const cell = byKey.get(`${g}-${l}`);
                const tone = colorFor(cell?.accuracy ?? null);
                return (
                  <td key={l} className="p-0.5">
                    <div
                      className="flex h-7 w-9 items-center justify-center rounded-md text-[10px] font-semibold"
                      style={tone}
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
      <div className="mt-3 flex items-center gap-2 text-[11px] text-[color:var(--shell-muted)]">
        <span>≥80%</span>
        <span className="h-3 w-4 rounded" style={{ background: "var(--cm-mint)" }} />
        <span>50–79%</span>
        <span className="h-3 w-4 rounded" style={{ background: "var(--cm-gold)" }} />
        <span>&lt;50%</span>
        <span className="h-3 w-4 rounded" style={{ background: "var(--cm-coral)" }} />
        <span>no data</span>
        <span className="h-3 w-4 rounded" style={{ background: "rgba(255,255,255,.08)" }} />
      </div>
    </div>
  );
}

function colorFor(accuracy: number | null): React.CSSProperties {
  if (accuracy === null) return { background: "rgba(255,255,255,.06)", color: "var(--shell-muted)" };
  if (accuracy >= 80) return { background: "var(--cm-mint)", color: "#fff" };
  if (accuracy >= 50) return { background: "var(--cm-gold)", color: "#0F172A" };
  return { background: "var(--cm-coral)", color: "#fff" };
}
