import { SkeletonText, SkeletonCardsGrid, SkeletonChart } from "@/components/skeletons";

export default function Loading() {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <SkeletonText width="w-48" height="h-8" />
        <SkeletonText width="w-64" height="h-4" />
      </header>
      <SkeletonCardsGrid count={4} />
      <SkeletonChart />
      <div className="grid gap-3 sm:grid-cols-2">
        <SkeletonChart height="h-20" />
        <SkeletonChart height="h-20" />
      </div>
    </main>
  );
}
