-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quiz" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "score" REAL,
    "difficulty" INTEGER NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'practice',
    "generatedBy" TEXT NOT NULL DEFAULT 'adaptive',
    "paramsJson" TEXT,
    "timeLimitSec" INTEGER,
    "timeUsedSec" INTEGER,
    "reviewUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "flaggedQuestionIds" TEXT NOT NULL DEFAULT '[]',
    "isDailyChallenge" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "Quiz_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Quiz" ("completedAt", "createdAt", "difficulty", "flaggedQuestionIds", "generatedBy", "id", "mode", "paramsJson", "reviewUnlocked", "score", "startedAt", "status", "studentId", "timeLimitSec", "timeUsedSec") SELECT "completedAt", "createdAt", "difficulty", "flaggedQuestionIds", "generatedBy", "id", "mode", "paramsJson", "reviewUnlocked", "score", "startedAt", "status", "studentId", "timeLimitSec", "timeUsedSec" FROM "Quiz";
DROP TABLE "Quiz";
ALTER TABLE "new_Quiz" RENAME TO "Quiz";
CREATE INDEX "Quiz_studentId_mode_idx" ON "Quiz"("studentId", "mode");
CREATE TABLE "new_XPLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" INTEGER NOT NULL,
    "quizId" INTEGER,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "XPLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "XPLog_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_XPLog" ("createdAt", "delta", "id", "reason", "studentId") SELECT "createdAt", "delta", "id", "reason", "studentId" FROM "XPLog";
DROP TABLE "XPLog";
ALTER TABLE "new_XPLog" RENAME TO "XPLog";
CREATE INDEX "XPLog_studentId_createdAt_idx" ON "XPLog"("studentId", "createdAt");
CREATE INDEX "XPLog_quizId_idx" ON "XPLog"("quizId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
