import { prisma } from "@/lib/db";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const groups = await prisma.topicGroup.findMany({
    where: { active: true },
    orderBy: [{ gradeLevel: "asc" }, { letter: "asc" }],
    select: { id: true, gradeLevel: true, letter: true, name: true },
  });

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">New student</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Set the child&apos;s grade and pick the topic groups to practise. The adaptive engine will only
          generate questions inside these groups.
        </p>
      </header>
      <OnboardingForm groups={groups} />
    </main>
  );
}
