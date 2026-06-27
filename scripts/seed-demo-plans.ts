/**
 * Demo plan seed: makes the existing demo parent PAID (so a client sees the
 * full app), and adds a FREE parent + child (so the paywall + 1-quiz/day limit
 * is demoable). Also syncs the app-name feature flag to "QuizSpark". Idempotent.
 *
 *   npx tsx scripts/seed-demo-plans.ts
 */
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

const FREE_PARENT = { email: "free@demo.local", password: "Free1234!", name: "Free Parent" };
const FREE_KID = { email: "freekid@demo.local", password: "Student1234!", name: "Sam" };
const FREE_KID_GRADE = 4;

(async () => {
  // 1) Sync the app name flag.
  await prisma.featureFlag.upsert({
    where: { key: "app_name" },
    update: { value: "QuizSpark" },
    create: { key: "app_name", enabled: true, value: "QuizSpark" },
  });

  // 2) Make the main demo parent PAID (full experience for the client demo).
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);
  const paid = await prisma.user.updateMany({
    where: { email: "parent@demo.local" },
    data: { plan: "paid", subscriptionStatus: "active", currentPeriodEnd: periodEnd },
  });
  console.log(`  ✓ parent@demo.local → Paid (${paid.count} updated)`);

  // 3) A FREE parent + one child to demonstrate the paywall.
  const org = await prisma.organization.findFirst({ select: { id: true } });
  const freeParent = await prisma.user.upsert({
    where: { email: FREE_PARENT.email },
    update: { plan: "free" },
    create: {
      email: FREE_PARENT.email,
      name: FREE_PARENT.name,
      role: "parent",
      passwordHash: hashSync(FREE_PARENT.password, 10),
      emailVerified: new Date(),
      plan: "free",
      orgId: org?.id ?? null,
    },
    select: { id: true },
  });

  const freeKid = await prisma.user.upsert({
    where: { email: FREE_KID.email },
    update: {},
    create: {
      email: FREE_KID.email,
      name: FREE_KID.name,
      role: "student",
      passwordHash: hashSync(FREE_KID.password, 10),
      emailVerified: new Date(),
      orgId: org?.id ?? null,
    },
    select: { id: true },
  });

  // One child for the free parent (skip if it already exists).
  const existing = await prisma.student.findFirst({ where: { userId: freeKid.id }, select: { id: true } });
  if (!existing) {
    const groups = await prisma.topicGroup.findMany({
      where: { gradeLevel: FREE_KID_GRADE, active: true },
      orderBy: { letter: "asc" },
      take: 3,
      select: { id: true },
    });
    await prisma.student.create({
      data: {
        name: FREE_KID.name,
        grade: FREE_KID_GRADE,
        currentDifficulty: 1,
        tutorApproved: true,
        parentId: freeParent.id,
        userId: freeKid.id,
        orgId: org?.id ?? null,
        topicSelections: { create: groups.map((g) => ({ topicGroupId: g.id })) },
      },
    });
    console.log(`  ✓ created free child "${FREE_KID.name}" (G${FREE_KID_GRADE}) under ${FREE_PARENT.email}`);
  } else {
    console.log(`  · free child already exists`);
  }

  console.log("\nDemo logins:");
  console.log("  PAID parent:  parent@demo.local / Parent1234!");
  console.log(`  FREE parent:  ${FREE_PARENT.email} / ${FREE_PARENT.password}`);
  console.log(`  FREE kid:     ${FREE_KID.email} / ${FREE_KID.password}`);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
