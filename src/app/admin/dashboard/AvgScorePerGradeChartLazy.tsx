"use client";

import dynamic from "next/dynamic";
import { SkeletonChart } from "@/components/skeletons";
import type { GradeRow } from "./AvgScorePerGradeChart";

const Inner = dynamic(() => import("./AvgScorePerGradeChart"), {
  ssr: false,
  loading: () => <SkeletonChart height="h-48" />,
});

export default function AvgScorePerGradeChartLazy(props: { data: GradeRow[] }) {
  return <Inner {...props} />;
}
