"use client";

import dynamic from "next/dynamic";
import { SkeletonChart } from "@/components/skeletons";
import type { TrendPoint } from "./ProgressTrendChart";

// recharts is heavy + browser-only; keep it out of the initial bundle.
const Inner = dynamic(() => import("./ProgressTrendChart"), {
  ssr: false,
  loading: () => <SkeletonChart height="h-56" />,
});

export default function ProgressTrendChartLazy(props: { data: TrendPoint[] }) {
  return <Inner {...props} />;
}
