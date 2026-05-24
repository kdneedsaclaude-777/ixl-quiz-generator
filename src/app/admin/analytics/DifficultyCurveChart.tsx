"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export type CurveRow = { difficulty: number } & Record<string, number | string>;

const GRADE_COLORS: Record<string, string> = {
  G4: "#ef4444",
  G5: "#f59e0b",
  G6: "#10b981",
  G7: "#06b6d4",
  G8: "#6366f1",
};

export default function DifficultyCurveChart({ data, grades }: { data: CurveRow[]; grades: string[] }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Avg score by difficulty · per grade</h3>
      <div className="mt-2 h-56 w-full" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
            <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
            <XAxis dataKey="difficulty" stroke="currentColor" tick={{ fontSize: 11 }} className="text-slate-400" />
            <YAxis domain={[0, 100]} stroke="currentColor" tick={{ fontSize: 11 }} className="text-slate-400" />
            <RTooltip
              contentStyle={{ background: "rgb(15 23 42)", border: "1px solid rgb(51 65 85)", borderRadius: 6, fontSize: 12, color: "white" }}
              labelStyle={{ color: "white" }}
              formatter={(v) => [`${v}%`, "Score"]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {grades.map((g) => (
              <Line key={g} type="monotone" dataKey={g} stroke={GRADE_COLORS[g] ?? "#999"} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
