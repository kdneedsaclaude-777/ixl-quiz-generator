import { SkeletonText, SkeletonChart } from "@/components/skeletons";

export default function Loading() {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <SkeletonText width="w-40" height="h-8" />
        <SkeletonText width="w-56" height="h-4" />
      </header>
      <SkeletonChart height="h-44" />
      <SkeletonChart />
      <SkeletonChart />
    </main>
  );
}
