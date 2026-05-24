"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

// Each row is a day; each child has a numeric column keyed by their name.
export type TrendRow = { day: string } & Record<string, number | string>;

export type ChildSeries = { name: string; color: string };

export default function ChildTrendChart({
  data,
  children,
}: {
  data: TrendRow[];
  children: ChildSeries[];
}) {
  const hasData = data.some((row) => children.some((c) => typeof row[c.name] === "number"));
  if (!hasData) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        No quiz history yet. Once your kids complete quizzes, the 30-day score trend will appear here.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Score % per day · last 30 days
      </h3>
      <div className="mt-2 h-56 w-full" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
            <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
            <XAxis dataKey="day" stroke="currentColor" tick={{ fontSize: 11 }} className="text-slate-400" />
            <YAxis domain={[0, 100]} stroke="currentColor" tick={{ fontSize: 11 }} className="text-slate-400" />
            <RTooltip
              contentStyle={{ background: "rgb(15 23 42)", border: "none", borderRadius: 6, fontSize: 12, color: "white" }}
              labelStyle={{ color: "white" }}
              formatter={(v) => [`${v}%`, "Score"]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {children.map((c) => (
              <Line
                key={c.name}
                type="monotone"
                dataKey={c.name}
                stroke={c.color}
                strokeWidth={2}
                dot={{ r: 2 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
