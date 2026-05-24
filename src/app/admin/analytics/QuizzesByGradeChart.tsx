"use client";

import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export type QuizzesByGradeRow = {
  grade: string; // "G1" … "G8"
  last7: number;
  last30: number;
};

export default function QuizzesByGradeChart({
  data,
}: {
  data: QuizzesByGradeRow[];
}) {
  const router = useRouter();
  // Click any bar → drill into the individual quizzes for that grade.
  function drill(row: QuizzesByGradeRow | undefined) {
    if (!row?.grade) return;
    const g = row.grade.replace(/^G/, "");
    router.push(`/admin/quizzes?gr=${g}`);
  }
  return (
    <div className="h-64 w-full" style={{ minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
          <XAxis dataKey="grade" stroke="currentColor" tick={{ fontSize: 11 }} className="text-slate-400" />
          <YAxis allowDecimals={false} stroke="currentColor" tick={{ fontSize: 11 }} className="text-slate-400" />
          <RTooltip
            contentStyle={{ background: "rgb(15 23 42)", border: "none", borderRadius: 6, fontSize: 12, color: "white" }}
            labelStyle={{ color: "white" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="last7"
            name="Last 7 days"
            fill="#6366f1"
            radius={[3, 3, 0, 0]}
            cursor="pointer"
            onClick={(d) => drill(d as unknown as QuizzesByGradeRow)}
          />
          <Bar
            dataKey="last30"
            name="Last 30 days"
            fill="#a5b4fc"
            radius={[3, 3, 0, 0]}
            cursor="pointer"
            onClick={(d) => drill(d as unknown as QuizzesByGradeRow)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
