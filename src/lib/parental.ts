import { prisma } from "@/lib/db";
import {
  isPracticeAllowedNow,
  parseLockedTopicGroupIds,
  type PracticeDecision,
  type ParentalSettingsView,
} from "@/lib/domain/parental-controls";

// DB-aware wrapper around the pure parental-controls module: loads the
// student's settings + counts today's quizzes, then runs the pure decision.
export async function loadPracticeDecision(studentId: number, now: Date = new Date()): Promise<PracticeDecision> {
  const settings = await prisma.parentalSettings.findUnique({ where: { studentId } });

  const view: ParentalSettingsView | null = settings
    ? {
        maxQuizzesPerDay: settings.maxQuizzesPerDay,
        windowStart: settings.windowStart,
        windowEnd: settings.windowEnd,
        windowTimezone: settings.windowTimezone,
        lockedTopicGroupIds: parseLockedTopicGroupIds(settings.lockedTopicGroupIds),
      }
    : null;

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const quizzesToday = await prisma.quiz.count({
    where: { studentId, createdAt: { gte: startOfDay } },
  });

  return isPracticeAllowedNow(view, quizzesToday, now);
}

export async function loadLockedTopicGroupIds(studentId: number): Promise<number[]> {
  const settings = await prisma.parentalSettings.findUnique({
    where: { studentId },
    select: { lockedTopicGroupIds: true },
  });
  return parseLockedTopicGroupIds(settings?.lockedTopicGroupIds);
}
