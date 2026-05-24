"use client";

import dynamic from "next/dynamic";
import { SkeletonChart } from "@/components/skeletons";
import type { DayRow } from "./QuizzesPerDayChart";

const Inner = dynamic(() => import("./QuizzesPerDayChart"), {
  ssr: false,
  loading: () => <SkeletonChart height="h-48" />,
});

export default function QuizzesPerDayChartLazy(props: { data: DayRow[] }) {
  return <Inner {...props} />;
}
