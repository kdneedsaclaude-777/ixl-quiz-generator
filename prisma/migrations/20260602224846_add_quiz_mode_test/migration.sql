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
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "Quiz_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Quiz" ("completedAt", "createdAt", "difficulty", "id", "score", "startedAt", "status", "studentId") SELECT "completedAt", "createdAt", "difficulty", "id", "score", "startedAt", "status", "studentId" FROM "Quiz";
DROP TABLE "Quiz";
ALTER TABLE "new_Quiz" RENAME TO "Quiz";
CREATE INDEX "Quiz_studentId_mode_idx" ON "Quiz"("studentId", "mode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
