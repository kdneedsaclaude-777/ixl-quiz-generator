"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export type DropOffRow = { day: string; started: number; completed: number };

export default function DropOffChart({ data }: { data: DropOffRow[] }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Quizzes started vs completed · last 30 days</h3>
      <div className="mt-2 h-56 w-full" style={{ minWidth: 0 }}>
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
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="started" fill="#94a3b8" radius={[3, 3, 0, 0]} />
            <Bar dataKey="completed" fill="#10b981" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
