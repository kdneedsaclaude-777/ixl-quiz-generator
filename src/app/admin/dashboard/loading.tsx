import { SkeletonText, SkeletonCardsGrid, SkeletonChart } from "@/components/skeletons";

export default function Loading() {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <SkeletonText width="w-48" height="h-8" />
        <SkeletonText width="w-32" height="h-4" />
      </header>
      <SkeletonCardsGrid count={6} />
      <div className="grid gap-3 lg:grid-cols-2">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <SkeletonChart height="h-72" />
    </main>
  );
}
