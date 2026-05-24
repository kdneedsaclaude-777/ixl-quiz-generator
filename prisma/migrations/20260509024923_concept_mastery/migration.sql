/*
  Warnings:

  - You are about to drop the `SkillProgress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SkillProgress";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ConceptMastery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "consecutiveCorrect" INTEGER NOT NULL DEFAULT 0,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "failedQuizzes" INTEGER NOT NULL DEFAULT 0,
    "remediationFlag" BOOLEAN NOT NULL DEFAULT false,
    "lastDifficulty" INTEGER NOT NULL DEFAULT 1,
    "lastQuizScore" REAL,
    "progressionNote" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConceptMastery_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConceptMastery_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ConceptMastery_studentId_skillId_key" ON "ConceptMastery"("studentId", "skillId");
