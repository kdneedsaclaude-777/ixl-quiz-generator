import { SkeletonText, SkeletonChart, SkeletonTable } from "@/components/skeletons";

export default function Loading() {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <SkeletonText width="w-48" height="h-8" />
        <SkeletonText width="w-64" height="h-4" />
      </header>
      <SkeletonChart height="h-24" />
      <SkeletonChart height="h-40" />
      <SkeletonChart height="h-64" />
      <SkeletonTable rows={6} />
    </main>
  );
}
