"use client";

import dynamic from "next/dynamic";
import { SkeletonChart } from "@/components/skeletons";
import type { CurveRow } from "./DifficultyCurveChart";

const Inner = dynamic(() => import("./DifficultyCurveChart"), {
  ssr: false,
  loading: () => <SkeletonChart height="h-56" />,
});

export default function DifficultyCurveChartLazy(props: { data: CurveRow[]; grades: string[] }) {
  return <Inner {...props} />;
}
