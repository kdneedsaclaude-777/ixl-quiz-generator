"use client";

import dynamic from "next/dynamic";
import { SkeletonChart } from "@/components/skeletons";
import type { TrendRow, ChildSeries } from "./ChildTrendChart";

const Inner = dynamic(() => import("./ChildTrendChart"), {
  ssr: false,
  loading: () => <SkeletonChart height="h-56" />,
});

export default function ChildTrendChartLazy(props: { data: TrendRow[]; children: ChildSeries[] }) {
  return <Inner {...props} />;
}
