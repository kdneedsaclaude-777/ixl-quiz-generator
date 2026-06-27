import { prisma } from "@/lib/db";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const raw = await prisma.topicGroup.findMany({
    where: { active: true },
    orderBy: [{ gradeLevel: "asc" }, { letter: "asc" }],
    select: { id: true, gradeLevel: true, letter: true, name: true, _count: { select: { skills: true } } },
  });
  const groups = raw.map((g) => ({
    id: g.id,
    gradeLevel: g.gradeLevel,
    letter: g.letter,
    name: g.name,
    skillCount: g._count.skills,
  }));

  return (
    <main className="mx-auto max-w-md">
      <OnboardingForm groups={groups} />
    </main>
  );
}
