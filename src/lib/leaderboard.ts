import { prisma } from "@/lib/db";
import {
  startOfWeek,
  rankWeeklyRows,
  type LeaderboardRow,
  type RankInput,
} from "@/lib/domain/leaderboard";

// Weekly-XP leaderboard, privacy-first. Two scopes only — family (siblings
// sharing a parent) and tutor cohort. Never global/org-wide. The scope's
// member query IS the privacy boundary: it can't return a student outside the
// family/cohort, so cross-family leakage is structurally impossible.
export type LeaderboardScope =
  | { kind: "family"; parentId: string }
  | { kind: "cohort"; tutorId: string };

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

export async function isLeaderboardEnabled(): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({ where: { key: "leaderboard" } });
  return flag?.enabled ?? false;
}

export async function loadWeeklyLeaderboard(
  scope: LeaderboardScope,
  viewerStudentId: number,
  now: Date = new Date(),
): Promise<LeaderboardRow[]> {
  // 1. Resolve scope members (id + name). This query bounds the whole feature.
  let members: { id: number; name: string }[];
  if (scope.kind === "family") {
    members = await prisma.student.findMany({
      where: { parentId: scope.parentId },
      select: { id: true, name: true },
    });
  } else {
    const links = await prisma.tutorAssignment.findMany({
      where: { tutorId: scope.tutorId },
      select: { student: { select: { id: true, name: true } } },
    });
    members = links.map((l) => l.student);
  }
  if (members.length === 0) return [];

  // 2. Weekly XP aggregate (sum delta, earliest createdAt for tiebreak).
  const weekStart = startOfWeek(now);
  const memberIds = members.map((m) => m.id);
  const agg = await prisma.xPLog.groupBy({
    by: ["studentId"],
    where: { studentId: { in: memberIds }, createdAt: { gte: weekStart } },
    _sum: { delta: true },
    _min: { createdAt: true },
  });
  const byStudent = new Map(agg.map((a) => [a.studentId, a]));

  // 3. Build rank inputs for ALL members (0 XP members still appear, ranked
  //    last) with privacy-projected names.
  const rankInputs: RankInput[] = members.map((m) => {
    const a = byStudent.get(m.id);
    return {
      studentId: m.id,
      name: scope.kind === "cohort" ? firstName(m.name) : m.name,
      xpThisWeek: Math.max(0, a?._sum.delta ?? 0),
      firstXpAt: a?._min.createdAt ? a._min.createdAt.getTime() : null,
    };
  });

  return rankWeeklyRows(rankInputs, viewerStudentId);
}

// Convenience for the child Home tile: pick the most meaningful scope for a
// student (family first, then tutor cohort) and return ranked rows + a label.
// Returns null when no scope has ≥2 members (a board of one is meaningless).
export async function loadChildWeeklyLeaderboard(
  studentId: number,
  now: Date = new Date(),
): Promise<{ rows: LeaderboardRow[]; scopeLabel: string } | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      parentId: true,
      tutorAssignments: { take: 1, select: { tutorId: true } },
    },
  });
  if (!student) return null;

  // Family scope if there are ≥2 siblings.
  if (student.parentId) {
    const siblingCount = await prisma.student.count({ where: { parentId: student.parentId } });
    if (siblingCount >= 2) {
      const rows = await loadWeeklyLeaderboard({ kind: "family", parentId: student.parentId }, studentId, now);
      if (rows.length >= 2) return { rows, scopeLabel: "Family" };
    }
  }

  // Otherwise the tutor cohort.
  const tutorId = student.tutorAssignments[0]?.tutorId;
  if (tutorId) {
    const rows = await loadWeeklyLeaderboard({ kind: "cohort", tutorId }, studentId, now);
    if (rows.length >= 2) return { rows, scopeLabel: "Cohort" };
  }

  return null;
}
