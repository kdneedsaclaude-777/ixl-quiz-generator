import type { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

// Seeds: platform superadmin (cross-org), one demo Organization with an
// org-admin, a parent, a tutor, and two students that have their OWN login
// accounts. Plus the 7 gamification badges + default feature flags.
// Idempotent via upserts.

const ADMIN_EMAIL = "admin@cm.local";
const ADMIN_PASSWORD = "Admin1234!";

const ORG_NAME = "Demo Academy";
const ORG_SLUG = "demo-academy";
const ORGADMIN_EMAIL = "orgadmin@demo.local";
const ORGADMIN_PASSWORD = "OrgAdmin1234!";
const PARENT_EMAIL = "parent@demo.local";
const PARENT_PASSWORD = "Parent1234!";
const TUTOR_EMAIL = "tutor@demo.local";
const TUTOR_PASSWORD = "Tutor1234!";
const STUDENT_A = { email: "ada@demo.local", password: "Student1234!", name: "Ben #2", grade: 2 };
const STUDENT_B = { email: "ben@demo.local", password: "Student1234!", name: "Ben", grade: 6 };

const BADGES = [
  { code: "first_quiz", name: "First Quiz", description: "Completed your first quiz.", icon: "🎯" },
  { code: "perfect_score", name: "Perfect Score", description: "Scored 100% on a quiz.", icon: "💯" },
  { code: "hot_streak", name: "Hot Streak", description: "5 quizzes in a row above 80%.", icon: "🔥" },
  { code: "topic_master", name: "Topic Master", description: "Scored 100% on a topic 3 times.", icon: "🏆" },
  { code: "speed_demon", name: "Speed Demon", description: "Completed a quiz in under 3 minutes.", icon: "⚡" },
  { code: "comeback_kid", name: "Comeback Kid", description: "Scored >80% on a topic after previously scoring <40%.", icon: "🌟" },
  { code: "dedicated", name: "Dedicated", description: "Practiced 7 days in a row.", icon: "📅" },
  // Expansion badges (must mirror src/lib/domain/badge-catalog.ts).
  { code: "streak3", name: "Warming Up", description: "Practiced 3 days in a row.", icon: "🌤️" },
  { code: "streak14", name: "Two Weeks Strong", description: "Practiced 14 days in a row.", icon: "🗓️" },
  { code: "streak30", name: "Unstoppable", description: "Practiced 30 days in a row.", icon: "🚀" },
  { code: "level5", name: "Rising Star", description: "Reached Level 5.", icon: "⭐" },
  { code: "level10", name: "Math Champion", description: "Reached Level 10.", icon: "👑" },
  { code: "test_ace", name: "Test Ace", description: "Scored 100% on a real test.", icon: "🎓" },
  { code: "daily_done", name: "Daily Challenge", description: "Completed a Daily Challenge.", icon: "📍" },
  { code: "centurion", name: "Centurion", description: "Completed 100 quizzes.", icon: "🏅" },
];

const FEATURE_FLAGS = [
  { key: "gamification", enabled: true, value: null },
  { key: "leaderboard", enabled: true, value: null },
  { key: "timer", enabled: true, value: null },
  { key: "dark_mode", enabled: true, value: null },
  { key: "diagnostic_quiz", enabled: true, value: null },
  { key: "maintenance_mode", enabled: false, value: null },
  { key: "email_notifications", enabled: true, value: null },
  { key: "app_name", enabled: true, value: "QuizSpark" },
  { key: "app_tagline", enabled: true, value: "Adaptive math practice for Grades 1–8." },
];

export async function seedAdmin(prisma: PrismaClient): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: "Platform Admin",
      role: "superadmin",
      orgId: null,
      passwordHash: hashSync(ADMIN_PASSWORD, 10),
      emailVerified: new Date(),
    },
  });
  return user.id;
}

async function upsertUser(
  prisma: PrismaClient,
  email: string,
  name: string,
  role: string,
  password: string,
  orgId: string,
): Promise<string> {
  const u = await prisma.user.upsert({
    where: { email },
    update: { role, orgId },
    create: {
      email,
      name,
      role,
      orgId,
      passwordHash: hashSync(password, 10),
      emailVerified: new Date(),
    },
  });
  await prisma.notificationSettings.upsert({
    where: { userId: u.id },
    update: {},
    create: { userId: u.id },
  });
  return u.id;
}

async function topicGroupIdsFor(prisma: PrismaClient, grade: number, letters: string[]): Promise<number[]> {
  const groups = await prisma.topicGroup.findMany({
    where: { gradeLevel: grade, letter: { in: letters } },
    select: { id: true },
  });
  return groups.map((g) => g.id);
}

async function upsertStudent(
  prisma: PrismaClient,
  args: {
    name: string;
    grade: number;
    orgId: string;
    parentId: string;
    accountUserId: string;
    topicGroupIds: number[];
  },
): Promise<number> {
  const existing = await prisma.student.findFirst({ where: { userId: args.accountUserId } });
  if (existing) return existing.id;
  const s = await prisma.student.create({
    data: {
      name: args.name,
      grade: args.grade,
      orgId: args.orgId,
      parentId: args.parentId,
      userId: args.accountUserId,
      currentDifficulty: 1,
      topicSelections: { create: args.topicGroupIds.map((id) => ({ topicGroupId: id })) },
    },
    select: { id: true },
  });
  return s.id;
}

export async function seedDemoOrg(prisma: PrismaClient): Promise<{
  orgId: string;
  studentIds: number[];
}> {
  const org = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    update: { name: ORG_NAME },
    create: { name: ORG_NAME, slug: ORG_SLUG },
  });

  await upsertUser(prisma, ORGADMIN_EMAIL, "Org Admin", "orgadmin", ORGADMIN_PASSWORD, org.id);
  const parentId = await upsertUser(prisma, PARENT_EMAIL, "Demo Parent", "parent", PARENT_PASSWORD, org.id);
  const tutorId = await upsertUser(prisma, TUTOR_EMAIL, "Demo Tutor", "tutor", TUTOR_PASSWORD, org.id);

  // Each student gets their own login account (role=student).
  const adaUserId = await upsertUser(prisma, STUDENT_A.email, STUDENT_A.name, "student", STUDENT_A.password, org.id);
  const benUserId = await upsertUser(prisma, STUDENT_B.email, STUDENT_B.name, "student", STUDENT_B.password, org.id);

  const adaTopics = await topicGroupIdsFor(prisma, STUDENT_A.grade, ["C", "D", "E"]); // G2 add/sub/mixed
  const benTopics = await topicGroupIdsFor(prisma, STUDENT_B.grade, ["J", "Q", "DD"]); // G6 fractions/percents/measurement

  const adaId = await upsertStudent(prisma, {
    name: STUDENT_A.name, grade: STUDENT_A.grade, orgId: org.id,
    parentId, accountUserId: adaUserId, topicGroupIds: adaTopics,
  });
  const benId = await upsertStudent(prisma, {
    name: STUDENT_B.name, grade: STUDENT_B.grade, orgId: org.id,
    parentId, accountUserId: benUserId, topicGroupIds: benTopics,
  });

  // Tutor oversees both demo students.
  for (const studentId of [adaId, benId]) {
    await prisma.tutorAssignment.upsert({
      where: { tutorId_studentId: { tutorId, studentId } },
      update: {},
      create: { tutorId, studentId },
    });
  }

  return { orgId: org.id, studentIds: [adaId, benId] };
}

export async function seedBadges(prisma: PrismaClient): Promise<number> {
  for (const b of BADGES) {
    await prisma.badge.upsert({ where: { code: b.code }, update: { name: b.name, description: b.description, icon: b.icon }, create: b });
  }
  return BADGES.length;
}

export async function seedFeatureFlags(prisma: PrismaClient): Promise<number> {
  for (const f of FEATURE_FLAGS) {
    await prisma.featureFlag.upsert({
      where: { key: f.key },
      update: { value: f.value ?? undefined },
      create: { key: f.key, enabled: f.enabled, value: f.value ?? undefined },
    });
  }
  return FEATURE_FLAGS.length;
}

export const SEED_CREDENTIALS = {
  superadmin: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  orgadmin: { email: ORGADMIN_EMAIL, password: ORGADMIN_PASSWORD },
  parent: { email: PARENT_EMAIL, password: PARENT_PASSWORD },
  tutor: { email: TUTOR_EMAIL, password: TUTOR_PASSWORD },
  studentA: { email: STUDENT_A.email, password: STUDENT_A.password },
  studentB: { email: STUDENT_B.email, password: STUDENT_B.password },
};
