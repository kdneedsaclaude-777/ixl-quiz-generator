"use client";

import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// `key` is the canonical YYYY-MM-DD; `day` is the short M/D label drawn on the
// axis. Drill-down uses `key` so the server-side day filter is unambiguous
// across locales/timezones.
export type DayRow = { key: string; day: string; quizzes: number };

export default function QuizzesPerDayChart({ data }: { data: DayRow[] }) {
  const router = useRouter();
  function drill(row: DayRow | undefined) {
    if (!row?.key) return;
    // status=all because per-day count includes started-but-not-finished quizzes.
    router.push(`/admin/quizzes?day=${row.key}&status=all`);
  }
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Quizzes per day · last 30 days <span className="ml-1 text-[10px] font-normal text-slate-500">(click a bar →)</span></h3>
      <div className="mt-2 h-48 w-full" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
            <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
            <XAxis dataKey="day" stroke="currentColor" tick={{ fontSize: 11 }} className="text-slate-400" />
            <YAxis allowDecimals={false} stroke="currentColor" tick={{ fontSize: 11 }} className="text-slate-400" />
            <RTooltip
              contentStyle={{ background: "rgb(15 23 42)", border: "1px solid rgb(51 65 85)", borderRadius: 6, fontSize: 12, color: "white" }}
              labelStyle={{ color: "white" }}
              cursor={{ fill: "rgba(99, 102, 241, 0.15)" }}
            />
            <Bar
              dataKey="quizzes"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(d) => drill(d as unknown as DayRow)}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
