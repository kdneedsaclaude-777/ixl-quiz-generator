"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

export type HistoryRow = {
  id: number;
  status: string;
  score: number | null;
  difficulty: number;
  completedAt: string | null;
  topics: { letter: string; name: string }[];
  hasAnswers: boolean;
};

export default function QuizHistory({ studentId, quizzes }: { studentId: number; quizzes: HistoryRow[] }) {
  const router = useRouter();
  const completed = quizzes.filter((q) => q.status === "completed" && typeof q.score === "number");
  // Last 10 completed quizzes that carry a real completion date, oldest→newest
  // so the line trends left→right. The x-axis below is a true time axis, so
  // the gap between two points reflects how far apart the quizzes actually
  // were — not just their order. `completedAt` is already on HistoryRow, so
  // no extra fetch is needed.
  const points = completed
    .filter((q) => q.completedAt)
    .slice(0, 10)
    .reverse()
    .map((q) => ({
      id: q.id,
      ts: new Date(q.completedAt as string).getTime(),
      score: Math.round(q.score ?? 0),
    }));

  // Time-axis domain. With a single point (or several at the same instant)
  // pad by ±12h so the dot isn't pinned against the chart edge.
  const tsList = points.map((p) => p.ts);
  const minTs = tsList.length ? Math.min(...tsList) : 0;
  const maxTs = tsList.length ? Math.max(...tsList) : 0;
  const tsPad = minTs === maxTs ? 12 * 60 * 60 * 1000 : 0;
  const timeDomain: [number, number] = [minTs - tsPad, maxTs + tsPad];

  // Explicit "en-US" locale (not `undefined`) so the server and the client —
  // which may have different locale settings — render identical strings and
  // don't trip React's hydration check.
  const fmtAxis = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const fmtFull = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="space-y-4">
      {points.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          No completed quizzes yet — once a quiz is finished, the score trend will show here.
        </p>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Score % over last {points.length} quizzes
            <span className="ml-1 text-[10px] font-normal text-slate-400 dark:text-slate-500">(click a point →)</span>
          </h3>
          {/* min-w-0 prevents flex/grid parents from collapsing the chart to width=-1, */}
          {/* which crashes recharts. See https://github.com/recharts/recharts/issues/172 */}
          <div className="mt-2 h-48 w-full" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
                {/* Real time axis — point spacing is proportional to elapsed time. */}
                <XAxis
                  dataKey="ts"
                  type="number"
                  scale="time"
                  domain={timeDomain}
                  tickFormatter={fmtAxis}
                  stroke="currentColor"
                  tick={{ fontSize: 11 }}
                  className="text-slate-400"
                />
                <YAxis domain={[0, 100]} stroke="currentColor" tick={{ fontSize: 11 }} className="text-slate-400" />
                <RTooltip
                  contentStyle={{ background: "rgb(15 23 42)", border: "none", borderRadius: 6, fontSize: 12, color: "white" }}
                  labelStyle={{ color: "white" }}
                  labelFormatter={(ts) => fmtFull(Number(ts))}
                  formatter={(v) => [`${v}%`, "Score"]}
                />
                <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" />
                <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3, cursor: "pointer" }}
                  activeDot={{
                    r: 6,
                    cursor: "pointer",
                    onClick: (_: unknown, payload: unknown) => {
                      const p = (payload as { payload?: { id?: number } } | undefined)?.payload;
                      if (p?.id) router.push(`/quiz/${p.id}/results?studentId=${studentId}`);
                    },
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Quiz</th>
              <th className="px-4 py-2">Score</th>
              <th className="hidden px-4 py-2 sm:table-cell">Topics</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {quizzes.map((q) => {
              const date = q.completedAt ? new Date(q.completedAt).toLocaleDateString("en-US") : "—";
              const isCompleted = q.status === "completed" && typeof q.score === "number";
              const isInProgress = !isCompleted && q.hasAnswers;
              return (
                <tr key={q.id}>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{date}</td>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-200">#{q.id}</td>
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">
                    {isCompleted ? (
                      `${Math.round(q.score ?? 0)}%`
                    ) : isInProgress ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                        In progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Not started
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-2 text-xs text-slate-500 sm:table-cell dark:text-slate-400">
                    {q.topics.length === 0
                      ? "—"
                      : q.topics.slice(0, 2).map((t) => t.name).join(", ") + (q.topics.length > 2 ? `, +${q.topics.length - 2} more` : "")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={
                        isCompleted
                          ? `/quiz/${q.id}/results?studentId=${studentId}`
                          : `/quiz/${q.id}?studentId=${studentId}`
                      }
                      className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {isCompleted ? "View" : isInProgress ? "Resume" : "Start"}
                    </Link>
                  </td>
                </tr>
              );
            })}
            {quizzes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">No quizzes yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
