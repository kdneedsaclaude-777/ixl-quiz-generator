"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

export type TrendPoint = { x: number; label: string; score: number };

export default function ProgressTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-56 w-full" style={{ minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
          <XAxis dataKey="label" stroke="currentColor" tick={{ fontSize: 11 }} className="text-amber-700" />
          <YAxis domain={[0, 100]} stroke="currentColor" tick={{ fontSize: 11 }} className="text-amber-700" />
          <RTooltip
            contentStyle={{ background: "rgb(120 53 15)", border: "none", borderRadius: 8, fontSize: 12, color: "white" }}
            labelStyle={{ color: "white" }}
            formatter={(v) => [`${v}%`, "Score"]}
          />
          <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" />
          <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#d97706"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
