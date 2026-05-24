"use client";

import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export type GradeRow = { grade: string; avgScore: number; quizzes: number };

const GRADE_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#06b6d4", "#6366f1"];

export default function AvgScorePerGradeChart({ data }: { data: GradeRow[] }) {
  const router = useRouter();
  function drill(row: GradeRow | undefined) {
    if (!row?.grade) return;
    const g = row.grade.replace(/^G/, "");
    router.push(`/admin/quizzes?gr=${g}`);
  }
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Avg score by grade · all time <span className="ml-1 text-[10px] font-normal text-slate-500">(click a bar →)</span></h3>
      <div className="mt-2 h-48 w-full" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
            <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
            <XAxis dataKey="grade" stroke="currentColor" tick={{ fontSize: 11 }} className="text-slate-400" />
            <YAxis domain={[0, 100]} stroke="currentColor" tick={{ fontSize: 11 }} className="text-slate-400" />
            <RTooltip
              contentStyle={{ background: "rgb(15 23 42)", border: "1px solid rgb(51 65 85)", borderRadius: 6, fontSize: 12, color: "white" }}
              labelStyle={{ color: "white" }}
              formatter={(v) => [`${v}%`, "Avg score"]}
              cursor={{ fill: "rgba(99, 102, 241, 0.15)" }}
            />
            <Bar
              dataKey="avgScore"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(d) => drill(d as unknown as GradeRow)}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
