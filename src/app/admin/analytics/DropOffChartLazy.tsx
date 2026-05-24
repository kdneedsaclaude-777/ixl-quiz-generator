"use client";

import dynamic from "next/dynamic";
import { SkeletonChart } from "@/components/skeletons";
import type { DropOffRow } from "./DropOffChart";

const Inner = dynamic(() => import("./DropOffChart"), {
  ssr: false,
  loading: () => <SkeletonChart height="h-56" />,
});

export default function DropOffChartLazy(props: { data: DropOffRow[] }) {
  return <Inner {...props} />;
}
