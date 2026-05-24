"use client";

import dynamic from "next/dynamic";
import { SkeletonChart } from "@/components/skeletons";
import type { QuizzesByGradeRow } from "./QuizzesByGradeChart";

const Inner = dynamic(() => import("./QuizzesByGradeChart"), {
  ssr: false,
  loading: () => <SkeletonChart height="h-64" />,
});

export default function QuizzesByGradeChartLazy(props: { data: QuizzesByGradeRow[] }) {
  return <Inner {...props} />;
}
